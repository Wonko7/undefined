(ns undef.pages
  (:use [undef.init :only [add-init!]]
        [undef.misc :only [show-admin-stuff]]
        [clojure.string :only [split]])
  (:require [fetch.remotes :as remotes]
            [undef.history :as hist]
            [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
                   [enfocus.macros :as em]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;; page inits:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(declare page-click)

(def page-inits {})
(def pre-link-inits {})

(defn add-page-init! [name func]
  (def page-inits (into page-inits {name func})))

(defn add-pre-link-init! [name func]
  (def pre-link-inits (into pre-link-inits {name func})))

(defn init-page []
  (let [data (em/from js/document
                      :init [:#metadata] (em/get-attr :data-init-page)
                      :args [:#metadata] (em/get-attr :data-init-args))]
    (em/at js/document
           [:#page-wrapper-wrapper :a] (em/listen :click page-click))
    (when (:init data)
      (if-let [f ((:init data) page-inits)]
        (f (:args data))))
    (show-admin-stuff)))

(defn get-pre-link [name]
  (pre-link-inits name))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;; page actions:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(def page-actions nil)

(defn add-future-page-action! [fun & args]
  (def page-actions (cons [fun args] page-actions)))

(defn clear-future-actions! []
  (doseq [[type id] page-actions]
    (cond (= type :timeout) (js/clearTimeout (first id))  ;; because I can't get (apply apply %) to work
          :else             (js/console.log (str "don't know how to clear " type))))
  (def page-actions nil))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;; floating menu:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; deactivate for now.
;(def scroll {:dir :up :pos 0})
;
;(defn show-fixed-menu [e]
;  (let [pos       js/window.pageYOffset
;        direction (if (> pos (:pos scroll)) :down :up)]
;    (when (not= direction (:dir scroll))
;      (em/at js/document
;             [:#nav] (if (= :up direction)
;                       (em/fade-in 100)
;                       (em/fade-out 100))))
;    (def scroll {:dir direction :pos pos})))
;
;(set! (.-onscroll js/window) show-fixed-menu)


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;; page loading:
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defn load-page [href args em-args em-fx]
  (fm/letrem [page (get-page href args)]
    (.scrollTo js/window 0 0)
    (em/at js/document
           [:#page-wrapper] (em/content page))
    (em-fx em-args)
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
         href (em/from a (em/get-attr :href))
         ext  (em/from a (em/get-attr :data-ext))
         pre  (em/from a (em/get-attr :data-pre-exec))
         href (if (= \/ (first href)) (apply str (next href)) href)
         fun  (re-find #"^\w+" href)
         args (map second (re-seq #"[/](\w+)" href))]
     (when-let [f (get-pre-link pre)]
       (f e (em/from a (em/get-attr :data-pre-args))))
     (when (not= ext "true")
       (.preventDefault e)
       (page-click fun args))))
  ;; can be called directly:
  ([href args & [no-hist]]
   (clear-future-actions!)
   (when (nil? no-hist)
     (if args
       (.setToken history (apply str (concat [href "/"] (interpose "/" args))))
       (.setToken history href)))
   (em/at js/document
          [:#loading-wrapper] (em/html-content "<div id=\"loading\"><img src=\"/img/loading.gif\"></div>")
          [:#page] (em/chain (em/fade-out 100)
                             #(load-page href args %1 %2)
                             (em/fade-in 100)
                             #(em/at js/document [:#loading] (em/remove-node)))))) ;; WARNING: this breaks em/chain

(add-init! #(em/at js/document
                   [:#nav :a] (em/listen :click page-click)))
