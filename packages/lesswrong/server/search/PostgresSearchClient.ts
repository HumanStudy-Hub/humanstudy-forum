import { getSqlClientOrThrow } from "@/server/sql/sqlClient";
import CommentsRepo from "@/server/repos/CommentsRepo";
import PostsRepo from "@/server/repos/PostsRepo";
import SequencesRepo from "@/server/repos/SequencesRepo";
import TagsRepo from "@/server/repos/TagsRepo";
import UsersRepo from "@/server/repos/UsersRepo";
import { postStatuses } from "@/lib/collections/posts/constants";
import type { HitsOnlySearchResponse, ElasticSearchHit } from "./elastic/ElasticClient";
import type { QueryData, QueryFilter } from "./elastic/ElasticQuery";
import type { MultiQueryData } from "./elastic/ElasticMultiQuery";

/**
 * A search backend that queries Postgres directly, for deployments without
 * Elasticsearch (the HumanStudy forum). It reuses each repo's search document
 * query, so hits have the same shape as the Elastic index, and mirrors the
 * visibility filters and private fields from ElasticConfig.
 *
 * Matching is a case-insensitive substring match on every search word; that
 * is plenty for a small forum but does no stemming or typo tolerance.
 */

type IndexSpec = {
  getQuery: () => string,
  /** Searchable fields with relevance weights. */
  fields: Record<string, number>,
  snippet: string,
  highlight?: string,
  /** SQL conditions on the document alias `d`, mirroring ElasticConfig filters. */
  where: string[],
  /** Small boost from a popularity column, mirroring ElasticConfig ranking. */
  popularity?: string,
  tiebreaker: string,
  karmaField?: string,
  privateFields: string[],
};

const indexSpecs: Record<string, IndexSpec> = {
  posts: {
    getQuery: () => new PostsRepo().getSearchDocumentQuery(),
    fields: { title: 3, authorDisplayName: 4, body: 1 },
    snippet: "body",
    highlight: "title",
    where: [
      `d."isFuture" IS NOT TRUE`,
      `d."draft" IS NOT TRUE`,
      `d."rejected" IS NOT TRUE`,
      `d."authorIsUnreviewed" IS NOT TRUE`,
      `d."unlisted" IS NOT TRUE`,
      `d."status" = ${postStatuses.STATUS_APPROVED}`,
      `d."baseScore" >= 0`,
    ],
    popularity: "baseScore",
    tiebreaker: "publicDateMs",
    privateFields: ["authorIsUnreviewed", "unlisted", "draft", "isFuture", "legacy", "rejected", "status", "viewCount"],
  },
  comments: {
    getQuery: () => new CommentsRepo().getSearchDocumentQuery(),
    fields: { body: 1, authorDisplayName: 11 },
    snippet: "body",
    highlight: "authorDisplayName",
    where: [
      `d."deleted" IS NOT TRUE`,
      `d."draft" IS NOT TRUE`,
      `d."rejected" IS NOT TRUE`,
      `d."authorIsUnreviewed" IS NOT TRUE`,
      `d."retracted" IS NOT TRUE`,
      `d."spam" IS NOT TRUE`,
    ],
    popularity: "baseScore",
    tiebreaker: "publicDateMs",
    privateFields: ["authorIsUnreviewed", "deleted", "draft", "legacy", "rejected", "retracted", "spam"],
  },
  users: {
    getQuery: () => new UsersRepo().getSearchDocumentQuery(),
    fields: {
      displayName: 10,
      bio: 1,
      mapLocationAddress: 1,
      jobTitle: 1,
      organization: 1,
      howICanHelpOthers: 1,
      howOthersCanHelpMe: 1,
    },
    snippet: "bio",
    where: [
      `d."deleted" IS NOT TRUE`,
      `d."deleteContent" IS NOT TRUE`,
    ],
    popularity: "karma",
    tiebreaker: "karma",
    karmaField: "karma",
    privateFields: ["deleteContent", "deleted", "isAdmin", "hideFromPeopleDirectory"],
  },
  sequences: {
    getQuery: () => new SequencesRepo().getSearchDocumentQuery(),
    fields: { title: 3, plaintextDescription: 1, authorDisplayName: 1 },
    snippet: "plaintextDescription",
    where: [
      `d."isDeleted" IS NOT TRUE`,
      `d."draft" IS NOT TRUE`,
      `d."hidden" IS NOT TRUE`,
    ],
    tiebreaker: "publicDateMs",
    privateFields: ["draft", "hidden", "isDeleted"],
  },
  tags: {
    getQuery: () => new TagsRepo().getSearchDocumentQuery(),
    fields: { name: 30, description: 1 },
    snippet: "description",
    where: [
      `d."deleted" IS NOT TRUE`,
      `d."isPlaceholderPage" IS NOT TRUE`,
      `d."adminOnly" IS NOT TRUE`,
    ],
    popularity: "postCount",
    tiebreaker: "postCount",
    privateFields: ["deleted"],
  },
};

const MAX_SEARCH_TOKENS = 8;
const SNIPPET_LENGTH = 200;
const identifierPattern = /^[A-Za-z_][A-Za-z0-9_]*$/;

const getIndexSpec = (index: string): IndexSpec => {
  const spec = indexSpecs[index];
  if (!spec) {
    throw new Error("Invalid index name: " + index);
  }
  return spec;
}

const quoteIdentifier = (field: string): string => {
  if (!identifierPattern.test(field)) {
    throw new Error("Invalid search field: " + field);
  }
  return `"${field}"`;
}

const tokenize = (search: string): string[] =>
  search.toLowerCase().split(/\s+/).map((t) => t.trim()).filter(Boolean).slice(0, MAX_SEARCH_TOKENS);

const escapeLike = (value: string): string => value.replace(/[\\%_]/g, (c) => `\\${c}`);

const stripHtml = (value: string): string =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Plain-text excerpt around the first match, HTML-escaped, with matches wrapped
 * in the highlight tags (the same format Elastic's highlighter returns).
 */
const buildHighlight = (
  raw: unknown,
  tokens: string[],
  preTag: string,
  postTag: string,
  excerpt: boolean,
): string | undefined => {
  if (typeof raw !== "string" || !raw) return undefined;
  const text = stripHtml(raw);
  const lower = text.toLowerCase();
  const firstMatch = tokens.reduce((min, token) => {
    const i = lower.indexOf(token);
    return i >= 0 && (min < 0 || i < min) ? i : min;
  }, -1);
  if (firstMatch < 0 && tokens.length > 0) return undefined;

  let fragment = text;
  if (excerpt && text.length > SNIPPET_LENGTH) {
    const start = Math.max(0, firstMatch - 40);
    fragment = (start > 0 ? "…" : "") + text.slice(start, start + SNIPPET_LENGTH) + "…";
  }
  let html = escapeHtml(fragment);
  if (tokens.length > 0) {
    const pattern = new RegExp(`(${tokens.map((t) => escapeRegExp(escapeHtml(t))).join("|")})`, "gi");
    html = html.replace(pattern, `${preTag}$1${postTag}`);
  }
  return html;
}

class PostgresSearchClient {
  async search(queryData: QueryData): Promise<HitsOnlySearchResponse> {
    const spec = getIndexSpec(queryData.index);
    const tokens = tokenize(queryData.search);
    const params: AnyBecauseHard[] = [];
    const addParam = (value: unknown) => {
      params.push(value);
      return `$${params.length}`;
    };

    const fieldSql = (field: string) => `COALESCE(d.${quoteIdentifier(field)}::TEXT, '')`;
    const fields = Object.keys(spec.fields);

    const conditions = [...spec.where];
    const scoreTerms: string[] = [];
    for (const token of tokens) {
      const pattern = addParam(`%${escapeLike(token)}%`);
      conditions.push(`(${fields.map((f) => `${fieldSql(f)} ILIKE ${pattern}`).join(" OR ")})`);
      for (const field of fields) {
        scoreTerms.push(`(CASE WHEN ${fieldSql(field)} ILIKE ${pattern} THEN ${spec.fields[field]} ELSE 0 END)`);
      }
    }
    for (const filter of queryData.filters) {
      conditions.push(this.compileFilter(filter, addParam));
    }

    let score = scoreTerms.length > 0 ? scoreTerms.join(" + ") : "0";
    if (spec.popularity) {
      score = `(${score}) + LN(1 + GREATEST(COALESCE(d.${quoteIdentifier(spec.popularity)}, 0), 0)) / 10.0`;
    }

    const orderBy = [
      ...this.compileSort(queryData.sorting, spec),
      `"_score" DESC`,
      `d.${quoteIdentifier(spec.tiebreaker)} DESC NULLS LAST`,
    ];

    const limit = addParam(queryData.limit ?? 10);
    const offset = addParam(queryData.offset ?? 0);

    const rows = await getSqlClientOrThrow().any<Record<string, unknown> & { _score: number, _total: string }>(`
      -- PostgresSearchClient.search(${queryData.index})
      SELECT d.*, ${score} AS "_score", COUNT(*) OVER () AS "_total"
      FROM (${spec.getQuery()}) d
      WHERE ${conditions.join(" AND ")}
      ORDER BY ${orderBy.join(", ")}
      LIMIT ${limit} OFFSET ${offset}
    `, params);

    const preTag = queryData.preTag ?? "<em>";
    const postTag = queryData.postTag ?? "</em>";
    const hits = rows.map((row): ElasticSearchHit => {
      const { _score, _total, ...doc } = row;
      for (const field of spec.privateFields) {
        delete doc[field];
      }
      const highlight: Record<string, string[]> = {};
      const snippet = buildHighlight(row[spec.snippet], tokens, preTag, postTag, true);
      if (snippet) highlight[spec.snippet] = [snippet];
      if (spec.highlight) {
        const value = buildHighlight(row[spec.highlight], tokens, preTag, postTag, false);
        if (value) highlight[spec.highlight] = [value];
      }
      return {
        _index: queryData.index,
        _id: String(row._id),
        _score: Number(_score),
        _source: doc as AnyBecauseHard,
        highlight,
      };
    });

    return {
      hits: {
        total: rows.length > 0 ? Number(rows[0]._total) : 0,
        hits,
      },
    };
  }

  async multiSearch(queryData: MultiQueryData): Promise<HitsOnlySearchResponse> {
    const limit = queryData.limit ?? 10;
    const results = [];
    // Sequential: the pool is small and each query is quick.
    for (const index of queryData.indexes) {
      results.push(await this.search({ index, search: queryData.search, filters: [], limit, offset: queryData.offset }));
    }
    // Normalize scores within each index before merging, like ElasticClient.
    const merged = results.flatMap(({ hits }) => {
      const maxScore = hits.hits.reduce((max, h) => Math.max(max, h._score ?? 0), 0);
      return maxScore > 0 ? hits.hits.map((h) => ({ ...h, _score: (h._score ?? 0) / maxScore })) : hits.hits;
    });
    merged.sort((a, b) => (b._score ?? 0) - (a._score ?? 0));
    return {
      hits: {
        total: merged.length,
        hits: merged.slice(0, limit),
      },
    };
  }

  private compileFilter(filter: QueryFilter, addParam: (value: unknown) => string): string {
    if (filter.type === "exists") {
      return `d.${quoteIdentifier(filter.field)} IS NOT NULL`;
    }
    if (filter.type === "numeric") {
      const ops = { gt: ">", gte: ">=", lt: "<", lte: "<=", eq: "=" } as const;
      return `d.${quoteIdentifier(filter.field)} ${ops[filter.op]} ${addParam(filter.value)}`;
    }

    // Facet filter. Dotted fields (e.g. tags._id) match inside a JSONB array of objects.
    const [field, subfield] = filter.field.split(".");
    let condition: string;
    if (subfield) {
      quoteIdentifier(subfield);
      condition = `COALESCE(d.${quoteIdentifier(field)}, '[]'::JSONB) @> JSONB_BUILD_ARRAY(JSONB_BUILD_OBJECT(${addParam(subfield)}::TEXT, ${addParam(filter.value)}::TEXT))`;
    } else if (filter.value === null) {
      condition = `d.${quoteIdentifier(field)} IS NULL`;
    } else if (typeof filter.value === "boolean") {
      condition = `d.${quoteIdentifier(field)} IS ${filter.value ? "TRUE" : "FALSE"}`;
    } else {
      condition = `d.${quoteIdentifier(field)}::TEXT = ${addParam(filter.value)}`;
    }
    return filter.negated ? `NOT (${condition})` : condition;
  }

  private compileSort(sorting: string | undefined, spec: IndexSpec): string[] {
    if (!sorting) return [];
    if (sorting.includes(":")) {
      const [field, order] = sorting.split(":");
      if (order !== "asc" && order !== "desc") {
        throw new Error("Invalid sorting order");
      }
      return [`d.${quoteIdentifier(field)} ${order.toUpperCase()} NULLS LAST`];
    }
    switch (sorting) {
      case "karma":
        return [`d.${quoteIdentifier(spec.karmaField ?? "baseScore")} DESC NULLS LAST`];
      case "newest_first":
        return [`d."publicDateMs" DESC NULLS LAST`];
      case "oldest_first":
        return [`d."publicDateMs" ASC NULLS LAST`];
      default:
        return [];
    }
  }
}

export default PostgresSearchClient;
