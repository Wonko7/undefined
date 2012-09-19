(ns undef.core
  (:use [undef.init :only [add-init!]]
        [undef.pages :only [load-page]])
  (:require [fetch.remotes :as remotes]
            [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
                   [enfocus.macros :as em]))

(defn init-first-page []
  (let [page (em/from (em/select [:#title]) (em/get-text))]
    (when (= "Loading..." page)
      (load-page "news"))))

(add-init! init-first-page :last)
