(defproject undefined "0.1.0-SNAPSHOT"
  :description "undefined's website"
  :dependencies [[org.clojure/clojure "1.4.0"]
                 ;; clj:
                 [noir "1.3.0-beta8"]
                 [enlive "1.0.0"]
                 [postgresql "9.1-901-1.jdbc4"];"8.4-702.jdbc4" ;; FIXME: adapt for server/local testing
                 [korma "0.3.0-beta9"]
                 ;; clj & cljs:
                 [fetch "0.1.0-alpha2"]
                 ;; cljs:
                 [enfocus "1.0.0-alpha3"]]
  :plugins [[lein-cljsbuild "0.2.6"]]
  :cljsbuild {
              :builds [{
                        :source-path "src-cljs"
                        :compiler {
                                   :output-to "resources/public/js/main.js"
                                   :optimizations :whitespace
                                   ;:externs ["web/js-static/jquery-min.js"]
                                   ; :optimizations :advanced
                                   :pretty-print true}}]}
  :main undefined.server)
