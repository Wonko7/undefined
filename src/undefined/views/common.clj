(ns undefined.views.common
  (:use [noir.core :only [defpartial]]
        [hiccup.page :only [include-js include-css html5]]))

;; shall be replaced with enlive
(defpartial layout [& content]
            (html5
              [:head
               [:title "undefined"]
               (include-css "/css/reset.css")
               (include-js "/js/main.js")]
              [:body
               [:div#wrapper
                content]]))
