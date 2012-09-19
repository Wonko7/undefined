(ns undef.pages
  (:use [undef.init :only [add-init!]])
  (:require [fetch.remotes :as remotes]
            [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
                   [enfocus.macros :as em]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;; page inits:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(def page-inits {})

;; WARNING: not thread safe.
(defn add-page-init! [name func]
  (def page-inits (into page-inits {name func})))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;; page loading:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(declare page-click)

(defn load-page [href & [args]]
  (fm/letrem [page (get-page href args)]
    (.scrollTo js/window 0 0)
    (em/at js/document
           [:#page-wrapper] (em/content page))
    (em/at js/document
           [:#page-wrapper :a] (em/listen :click page-click))
    (if-let [init (href page-inits)]
      (init href args))))

(defn page-click [e]
  (let [a    (.-currentTarget e)
        href (em/from a (em/get-attr :href))
        ext  (em/from a (em/get-attr :data-ext))
        args (em/from a (em/get-attr :data-args))]
    ;; FIXME this should work. check css-select.
    ;(js/console.log (str (em/from a
    ;                              :href [:a] (em/get-attr :href)
    ;                              :args [:a] (em/get-attr :data-args))))
    (when (not= ext "true")
      (.preventDefault e)
      (em/at js/document
             [:#page] (em/chain
                        (em/fade-out 100)
                        (ef/chainable-standard #(load-page href args)) ;; if you want synch, this is where it should be done, chainable.
                        (em/fade-in 100))))))

(add-init! #(em/at js/document
                   [:#nav :a] (em/listen :click page-click)))
