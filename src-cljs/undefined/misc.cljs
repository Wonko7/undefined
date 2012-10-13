(ns undef.misc
  (:require-macros [fetch.macros :as fm]
                   [enfocus.macros :as em])           
  (:require [fetch.remotes :as remotes]
            [enfocus.core :as ef]
            [goog.style :as style]))

(defn show-admin-stuff []
  (fm/letrem [[user roles] (get-user)] 
    (em/at js/document
           [:.admin] (if (:undefined.server/admin roles)
                       (em/remove-class "hidden")
                       (em/add-class "hidden")))))

;; FIXME this should be extendend to restore-size with :curw/h à la em/resize to select w and/or h.
(defn restore-height [speed]
  (ef/chainable-standard
    (fn [node]
      (let [h (:size (em/from node
                              :size [:>] (fn [children]
                                           (let [red-bot-top   #(+ %1 (.-top %2) (.-bottom %2))
                                                 nodes-or-node #(if (seq? %1) %1 [%1])
                                                 marg (reduce red-bot-top 0 (nodes-or-node ((ef/extr-multi-node style/getPaddingBox) children)))
                                                 bord (reduce red-bot-top 0 (nodes-or-node ((ef/extr-multi-node style/getBorderBox) children)))
                                                 size (reduce #(+ %1 (.-height %2)) 0 (nodes-or-node ((ef/extr-multi-node style/getSize) children)))]
                                             (+ marg bord size)))))]
        ((em/chain (em/resize :curwidth h speed)
                   (em/remove-style :height :width)) node)))))
