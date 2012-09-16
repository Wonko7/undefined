(ns undef.pages
  (:use [undef.init :only [add-init!]])
  (:require [fetch.remotes :as remotes]
            [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
                   [enfocus.macros :as em]))

(defn load-page [href & [args]]
  (fm/letrem [page (get-page href args)]
    (em/at js/document
           [:#page-wrapper] (em/content page))))

(defn page-click [e]
  (let [a    (.-currentTarget e)
        href (em/from a (em/get-attr :href))]
    (.preventDefault e)
    (em/at js/document
           [:#page] (em/chain
                      (em/fade-out 100)
                      (ef/chainable-standard #(load-page href))
                      (em/fade-in 100)))))

(add-init! #(em/at js/document
                   [:#nav :a] (em/listen :click page-click)))
