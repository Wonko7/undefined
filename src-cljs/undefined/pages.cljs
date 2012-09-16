(ns undef.pages
  (:require [fetch.remotes :as remotes]
            [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
                   [enfocus.macros :as em]))

(defn load-page [href]
  (fm/letrem [page (get-page href)]
    (em/at js/document
           [:#content] (em/content page))))
