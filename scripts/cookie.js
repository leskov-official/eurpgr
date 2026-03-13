 (() => {
   "use strict";

   const CONSENT_KEY = "europagar_cookie_consent";
   const CONSENT_DAYS = 180;
   const BAR_ID = "cookie-consent-bar";
   const ACCEPT_SEL = ".cookie-btn-accept";
   const OPEN_CLASS = "is-open";

   function getCookiePath() {
     return "/";
   }

   function getCookie(name) {
     const all = document.cookie ? document.cookie.split(";") : [];
     for (const part of all) {
       const cookie = part.trim();
       if (cookie.startsWith(name + "=")) {
         return decodeURIComponent(cookie.substring(name.length + 1));
       }
     }
     return null;
   }

   function setCookie(name, value, days) {
     const maxAge = Math.max(1, Number(days) || 1) * 24 * 60 * 60;
     const path = getCookiePath();

     let cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=${path}; SameSite=Lax`;
     if (location.protocol === "https:") cookie += "; Secure";

     document.cookie = cookie;
   }

   function deleteCookie(name, pathOverride) {
     const path = pathOverride || getCookiePath();
     let cookie = `${name}=; Max-Age=0; Path=${path}; SameSite=Lax`;
     if (location.protocol === "https:") cookie += "; Secure";
     document.cookie = cookie;
   }

   function getStoredConsent() {
     const c = getCookie(CONSENT_KEY);
     if (c) return c;

     try {
       return localStorage.getItem(CONSENT_KEY);
     } catch {
       return null;
     }
   }

   function storeConsent(value) {
     try { setCookie(CONSENT_KEY, value, CONSENT_DAYS); } catch {}
     try { localStorage.setItem(CONSENT_KEY, value); } catch {}
   }

   function getBar() {
     return document.getElementById(BAR_ID);
   }

   function showBar() {
     const bar = getBar();
     if (!bar) return;

     bar.setAttribute("aria-hidden", "false");
     bar.classList.add(OPEN_CLASS);
   }

   function hideBar() {
     const bar = getBar();
     if (!bar) return;

     bar.setAttribute("aria-hidden", "true");
     bar.classList.remove(OPEN_CLASS);
   }

   function acceptCookies() {
     storeConsent("accepted");
     hideBar();
   }

   function initCookieConsent() {
     const bar = getBar();
     if (!bar) return;

     if (!bar.hasAttribute("aria-hidden")) {
       bar.setAttribute("aria-hidden", "true");
     }

     const btnAccept = bar.querySelector(ACCEPT_SEL);

     if (btnAccept) {
       btnAccept.addEventListener("click", (e) => {
         e.preventDefault();
         acceptCookies();
       });
     }

     const consent = getStoredConsent();
     if (!consent) showBar();
     else hideBar();
   }

   if (document.readyState === "loading") {
     document.addEventListener("DOMContentLoaded", initCookieConsent);
   } else {
     initCookieConsent();
   }

   window.EUROPAGAR_COOKIE = {
     get: () => getStoredConsent(),
     accept: acceptCookies,
     reset: () => {
       try { deleteCookie(CONSENT_KEY, "/"); } catch {}
       try { deleteCookie(CONSENT_KEY, "/europagar/"); } catch {}
       try { deleteCookie(CONSENT_KEY); } catch {}
       try { localStorage.removeItem(CONSENT_KEY); } catch {}
       showBar();
     }
   };

 })();
