(ns undef.pages
  (:use [undef.init :only [add-init!]]
        [clojure.string :only [split]])
  (:require [fetch.remotes :as remotes]
            [undef.history :as hist]
            [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
                   [enfocus.macros :as em]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;; page inits:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(def page-inits {})

(defn add-page-init! [name func]
  (def page-inits (into page-inits {name func})))

(defn init-page []
  (let [data (em/from js/document
                      :init [:#metadata] (em/get-attr :data-init-page)
                      :args [:#metadata] (em/get-attr :data-init-args))]
    (when (:init data)
      (if-let [f ((:init data) page-inits)]
        (f (:args data))))))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;; page actions:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(def page-actions nil)

(defn add-future-page-action! [fun & args]
  (def page-actions (cons [fun args] page-actions)))

(defn clear-future-actions! []
  (doseq [[type id] page-actions]
    (cond (= type :timeout) (js/clearTimeout (first id)) 
          :else             (js/console.log (str "don't know how to clear " type))))
  (def page-actions nil))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;; floating menu:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(def scroll {:dir :up :pos 0})

(defn show-fixed-menu [e]
  (let [pos       js/window.pageYOffset
        direction (if (> pos (:pos scroll)) :down :up)]
    (when (not= direction (:dir scroll))
      (em/at js/document
             [:#nav] (if (= :up direction)
                       (em/fade-in 100)
                       (em/fade-out 100))))
    (def scroll {:dir direction :pos pos})))

(set! (.-onscroll js/window) show-fixed-menu)

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
    (init-page)))


(def history (hist/history (fn [{:keys [token navigation?]}]
                             (when navigation?
                               (let [[href arg] (split token #"[/]")]
                                 (page-click href arg :no-hist))))))

;; FIXME this should work. check css-select.
;(js/console.log (str (em/from a
;                              :href [:a] (em/get-attr :href)
;                              :args [:a] (em/get-attr :data-args))))
(defn page-click
  ;; call with an event (used through em/listen)
  ([e]
   (let [a    (.-currentTarget e)
         href (em/from a (em/get-attr :data-href))
         ext  (em/from a (em/get-attr :data-ext))
         args (em/from a (em/get-attr :data-args))]
     (when (not= ext "true")
       (.preventDefault e)
       (page-click href args))))
  ;; can be called directly:
  ([href args & [no-hist]]
   (clear-future-actions!)
   (when (nil? no-hist)
     (if args
       (.setToken history (str href "/" args)) ;; check if args is a seq. if so, reduce it.
       (.setToken history href)))
   (em/at js/document
          [:#page] (em/chain
                     (em/fade-out 100)
                     (ef/chainable-standard #(load-page href args)) ;; if you want synch, this is where it should be done, chainable.
                     (em/fade-in 100)))))

(add-init! #(em/at js/document
                   [:#nav :a] (em/listen :click page-click)))
