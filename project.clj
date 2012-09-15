(defproject undefined "0.1.0-SNAPSHOT"
  :description "undefined's website"
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [noir "1.3.0-beta8"]
                 [fetch "0.1.0-alpha2"]
                 [enlive "1.0.0"]]
  :plugins [[lein-cljsbuild "0.2.6"]]
  :cljsbuild {
              :builds [{
                        :source-path "src-cljs"
                        :compiler {
                                   :output-to "resources/public/js/main.js"
                                   :optimizations :whitespace
                                   ;:externs ["web/js-static/jquery-min.js"
                                   ;          "web/js-static/src/jqtouch.min.js" 
                                   ;          "web/js-static/src/jqtouch-jquery.min.js"] 
                                   ; :optimizations :advanced
                                   :pretty-print true}}]}
  :main undefined.server)
