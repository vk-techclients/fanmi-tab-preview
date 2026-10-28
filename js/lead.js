/*
 * Fanmi Tab — shared lead capture for the booking form AND the chat assistant.
 *
 * WHERE SUBMISSIONS LAND
 * ----------------------
 * GO-LIVE (domain launch): set LEAD_ENDPOINT to the VK house lead-capture route.
 * Submissions then POST straight into the house leads store and notify
 * fanmitab@gmail.com — one click, nothing for the visitor to send.
 *
 * PREVIEW MODE (LEAD_ENDPOINT empty): the inquiry is (1) appended to this
 * browser's local lead log (localStorage "fanmitab_leads") and (2) composed
 * into a pre-addressed email to fanmitab@gmail.com that the visitor sends
 * with one tap from the confirmation panel. The visitor also always has the
 * alternate path: Fanmi Tab's existing Tally inquiry form.
 */
(function () {
  var LEAD_ENDPOINT = ""; // <-- set at go-live
  var LEAD_EMAIL = "fanmitab@gmail.com";

  function lines(p) {
    var rows = [
      ["Name", p.name], ["Email", p.email], ["Phone", p.phone],
      ["Service", p.service], ["Event date", p.date],
      ["Guests", p.guests], ["City / ZIP", p.city],
      ["Dietary considerations", p.dietary],
      ["Preferred contact", p.contact_pref], ["Heard about us", p.heard],
      ["Notes", p.message]
    ];
    return rows.filter(function (r) { return r[1]; })
               .map(function (r) { return r[0] + ": " + r[1]; });
  }

  function mailtoFor(p) {
    var subject = "Fanmi Tab inquiry — " + (p.service || "General") +
                  (p.date ? " — " + p.date : "");
    var body = "Hello Fanmi Tab,\n\n" + lines(p).join("\n") +
               "\n\n— sent from fanmitab.com";
    return "mailto:" + LEAD_EMAIL + "?subject=" + encodeURIComponent(subject) +
           "&body=" + encodeURIComponent(body);
  }

  function logLocal(p) {
    try {
      var key = "fanmitab_leads";
      var arr = JSON.parse(localStorage.getItem(key) || "[]");
      arr.push(Object.assign({ at: new Date().toISOString() }, p));
      localStorage.setItem(key, JSON.stringify(arr));
    } catch (e) { /* private mode etc. — mailto path still works */ }
  }

  window.FanmiLead = {
    email: LEAD_EMAIL,
    capture: function (payload) {
      logLocal(payload);
      if (LEAD_ENDPOINT) {
        return fetch(LEAD_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(Object.assign({ business: "Fanmi Tab", source: "fanmitab.com" }, payload))
        }).then(function (r) {
          return { mode: r.ok ? "endpoint" : "mailto", mailto: mailtoFor(payload) };
        }).catch(function () {
          return { mode: "mailto", mailto: mailtoFor(payload) };
        });
      }
      return Promise.resolve({ mode: "mailto", mailto: mailtoFor(payload) });
    }
  };
})();
