import { humanStudyHubAuthSetting, humanStudyHubAuthOriginSetting } from '@/lib/instanceSettings';
import { useForumType } from '@/components/hooks/useForumType';
import { hubAccountUrl } from '@/lib/auth/hubAuthLinks';
import React, { MouseEvent, useCallback, useState } from 'react';
import Button from '@/lib/vendor/@material-ui/core/src/Button';
import { useTracking } from '../../lib/analyticsEvents';
import LWClickAwayListener from "../common/LWClickAwayListener";
import LWPopper from "../common/LWPopper";
import LoginForm from "./LoginForm";
import { Paper } from '../widgets/Paper';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { isBlackBarTitle } from '../seasonal/petrovDay/petrov-day-story/petrovConsts';

const styles = defineStyles('UsersAccountMenu', (theme: ThemeType) => ({
  root: {
    marginTop: 5,
  },
  userButton: {
    fontSize: '14px',
    fontWeight: 400,
    opacity: .8,
    color: isBlackBarTitle ? theme.palette.text.alwaysWhite : theme.palette.header.text,
  },
}));

export const LWUsersAccountMenu = () => {
  const classes = useStyles(styles);
  const {captureEvent} = useTracking();
  const { forumType } = useForumType();
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handleClick = useCallback((ev: MouseEvent) => {
    ev.preventDefault();
    if (humanStudyHubAuthSetting.get(forumType)) {
      window.location.href = hubAccountUrl(humanStudyHubAuthOriginSetting.get(forumType), window.location.href);
      return;
    }
    captureEvent("loginButtonClicked", {open: true});
    setOpen(true);
    setAnchorEl(ev.currentTarget as HTMLElement);
  }, [captureEvent, forumType]);

  const handleRequestClose = useCallback(() => {
    captureEvent("loginButtonClicked", {open: false});
    setOpen(false);
  }, [captureEvent]);
  return (
    <div className={classes.root}>
      <Button data-testid="user-signup-button" onClick={handleClick}>
        <span className={classes.userButton}>
          Login
        </span>
      </Button>
      <LWPopper
        open={open}
        anchorEl={anchorEl}
        placement="bottom-end"
      >
        <LWClickAwayListener onClickAway={handleRequestClose}>
          <Paper>
            {open && <LoginForm autoFocus />}
          </Paper>
        </LWClickAwayListener>
      </LWPopper>
    </div>
  );
}
