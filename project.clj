(defproject undefined "0.1.0-SNAPSHOT"
  :description "undefined's website"
  :dependencies [[org.clojure/clojure "1.4.0"]
                 ;; clj:
                 [noir "1.3.0-beta8"]
                 [enlive "1.0.0"]
                 [korma "0.3.0-beta9"]
                 [clj-time "0.4.4"]
                 [com.cemerick/friend "0.1.1-SNAPSHOT" :exclusions [ring/ring-core]]
                 ;; clj & cljs:
                 [fetch "0.1.0-alpha2"]
                 ;; cljs:
                 [enfocus "1.0.0-alpha3"]
                 ;; tests: FIXME can we specify dependencies for tests only? what does :scope do?
                 [clj-webdriver "0.6.0-alpha11"]]
  :plugins [[lein-cljsbuild "0.2.6"]]
  :cljsbuild {
              :builds [{
                        :source-path "src-cljs"
                        :compiler {:output-to "resources/public/js/main.js"
                                   :optimizations :advanced
                                   ;:externs ["lol.js"]
                                   :pretty-print false}}]}
  :profiles {:srv-test {:dependencies [[postgresql "8.4-702.jdbc4"]]}
             :srv-prod {:dependencies [[postgresql "8.4-702.jdbc4"]]} ;; FIXME; adapt port settings
             :c        {:dependencies [[postgresql "9.1-901-1.jdbc4"]]}
             :w        {:dependencies [[postgresql "9.1-901-1.jdbc4"]]}}
  :aliases {"runc" ["with-profile" "c" "run"]
            "runw" ["with-profile" "w" "run"]}
  :main undefined.server)
