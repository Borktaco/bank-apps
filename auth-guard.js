/* Bank apps lock.
   Anyone with the link can still view a page.
   Only Dad's Google account can save changes.
   Firebase database rules enforce this on the server side too. */
(function () {
  var OWNERS = ['masterbork@gmail.com', 'alecnbourque@gmail.com'];
  var auth = null;
  var user = null;
  var pill = null;
  var ownerHooks = [];

  function isOwnerUser(u) {
    return !!(u && u.emailVerified && u.email && OWNERS.indexOf(u.email.toLowerCase()) !== -1);
  }

  function getAuth() {
    if (!auth && window.firebase && firebase.apps && firebase.apps.length && firebase.auth) {
      auth = firebase.auth();
    }
    return auth;
  }

  function msg(text) {
    var el = document.getElementById('bank-lock-msg');
    if (!el) {
      el = document.createElement('div');
      el.id = 'bank-lock-msg';
      el.style.cssText = 'position:fixed;left:50%;bottom:calc(64px + env(safe-area-inset-bottom));transform:translateX(-50%);' +
        'max-width:88vw;background:rgba(20,20,24,.94);color:#fff;font:600 15px/1.35 -apple-system,system-ui,sans-serif;' +
        'padding:12px 16px;border-radius:14px;box-shadow:0 6px 24px rgba(0,0,0,.35);z-index:99999;text-align:center;' +
        'opacity:0;transition:opacity .25s;pointer-events:none';
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.opacity = '1';
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.style.opacity = '0'; }, 5000);
  }

  function paint() {
    if (!pill) return;
    pill.textContent = isOwnerUser(user) ? '🔓 Dad signed in' : '🔒 Dad sign in';
  }

  function signIn() {
    var a = getAuth();
    if (!a) {
      msg('Sign in is not available right now.');
      return Promise.resolve(false);
    }
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return a.signInWithPopup(provider).then(function (res) {
      if (isOwnerUser(res.user)) {
        msg('Signed in. You can make changes now.');
        return true;
      }
      return a.signOut().then(function () {
        msg('That Google account can\'t make changes here.');
        return false;
      });
    }).catch(function (err) {
      var c = (err && err.code) || '';
      if (c === 'auth/popup-closed-by-user' || c === 'auth/cancelled-popup-request') return false;
      if (c === 'auth/operation-not-allowed' || c === 'auth/configuration-not-found') {
        msg('Google sign in is not turned on in Firebase yet.');
      } else if (c === 'auth/unauthorized-domain') {
        msg('Add borktaco.github.io to Firebase authorized domains.');
      } else if (c === 'auth/popup-blocked') {
        msg('Allow pop ups for this site, then tap again.');
      } else {
        msg('Sign in failed. ' + ((err && err.message) || c));
      }
      return false;
    });
  }

  function onPillTap() {
    var a = getAuth();
    if (isOwnerUser(user)) {
      if (a && window.confirm('Sign out? Changes will be locked on this device.')) {
        a.signOut().then(function () { msg('Signed out.'); });
      }
    } else {
      signIn();
    }
  }

  function start() {
    pill = document.createElement('button');
    pill.type = 'button';
    pill.id = 'bank-lock-pill';
    pill.style.cssText = 'position:fixed;left:10px;bottom:calc(10px + env(safe-area-inset-bottom));z-index:99998;' +
      'border:0;border-radius:999px;padding:7px 12px;background:rgba(20,20,24,.72);color:#fff;' +
      'font:600 12px/1 -apple-system,system-ui,sans-serif;cursor:pointer;-webkit-tap-highlight-color:transparent';
    pill.addEventListener('click', onPillTap);
    document.body.appendChild(pill);
    paint();
    var a = getAuth();
    if (a) a.onAuthStateChanged(function (u) {
      user = u;
      paint();
      if (isOwnerUser(u)) ownerHooks.forEach(function (fn) { try { fn(); } catch (e) {} });
    });
  }

  window.BankAuth = {
    isOwner: function () { return isOwnerUser(user); },
    signIn: signIn,
    // Run fn whenever an allowed account is signed in on this device.
    onOwner: function (fn) {
      ownerHooks.push(fn);
      if (isOwnerUser(user)) { try { fn(); } catch (e) {} }
    },
    // Use from a button tap. Resolves true when Dad is signed in.
    requireOwner: function () {
      return isOwnerUser(user) ? Promise.resolve(true) : signIn();
    },
    // Wrap a save. If Firebase refuses it, show the lock message and stop.
    guard: function (p) {
      return Promise.resolve(p).then(function (v) { return v; }, function (err) {
        var denied = err && (err.code === 'PERMISSION_DENIED' || /permission/i.test(err.message || ''));
        msg(denied
          ? '🔒 Locked. Only Dad can make changes. Dad, tap Sign in at the bottom left.'
          : 'Save failed. ' + ((err && err.message) || err));
        return new Promise(function () {});
      });
    },
    // Wrap a background save (like the BTC price). Fails silently.
    quiet: function (p) {
      return Promise.resolve(p).catch(function () {});
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
