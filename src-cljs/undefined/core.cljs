(ns undef.core
  (:use [undef.init :only [add-init!]]
        [undef.pages :only [load-page init-page add-page-init!]])
  (:require [fetch.remotes :as remotes]
            [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
                   [enfocus.macros :as em]))

(defn init-first-page []
  (let [page (em/from (em/select [:#title]) (em/get-text))]
    (if (= "Loading..." page)
      (load-page "news")
      (init-page))))

(defn p404 [& [args]] ;; FIXME: trigger click?
  (js/setTimeout #(load-page "news") 3000))

(add-page-init! "404" p404)

(add-init! init-first-page :last)
