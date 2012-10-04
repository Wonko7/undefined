(ns undef.misc
  (:require-macros [fetch.macros :as fm]
                   [enfocus.macros :as em])           
  (:require [fetch.remotes :as remotes]
            [enfocus.core :as ef]
            [goog.style :as style]))

(defn show-admin-stuff []
  (fm/letrem [[user roles] (get-user)] 
    ;; (js/console.log (str roles)) ;; FIXME not sure if bug or just slow...
    (em/at js/document
           [:.admin] (if (:undefined.server/admin roles)
                       (em/remove-class "hidden")
                       (em/add-class "hidden")))))

;; FIXME this should be extendend to restore-size with :curw/h à la em/resize to select w and/or h.
(defn restore-height [speed]
  (ef/chainable-standard
    (fn [node]
      (let [h (:size (em/from node
                              :size [:> :*] (fn [children]
                                              (reduce #(let [marg ((ef/extr-multi-node style/getPaddingBox) %2)
                                                             bord ((ef/extr-multi-node style/getBorderBox) %2)
                                                             size ((ef/extr-multi-node style/getSize) %2)]
                                                         (+ %1 (.-top marg) (.-bottom marg) (.-top bord) (.-bottom bord) (.-height size)))
                                                      0
                                                      (if (seq? children) children [children])))))]
        ((em/chain (em/resize :curwidth h speed)
                   (em/remove-style :height :width)) node)))))
