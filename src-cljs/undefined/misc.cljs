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

;; WARNING: only works if node has ONE child.
;; FIXME this should be extendend to restore-size with :curw/h à la em/resize to select w and/or h.
;;       this should be extendend to support multiple children on then node. 
(defn restore-height [speed]
  (ef/chainable-standard
    (fn [node]
      (let [h (:size (em/from node
                              :size [:> :*] (fn [child]
                                              (let [+-bot-top   #(+ (.-top %1) (.-bottom %1))
                                                    marg (+-bot-top ((ef/extr-multi-node style/getPaddingBox) child))
                                                    bord (+-bot-top ((ef/extr-multi-node style/getBorderBox) child))
                                                    size (.-height ((ef/extr-multi-node style/getSize) child))]
                                                (+ marg bord size)))))]
        ((em/chain (em/resize :curwidth h 600)
                   (em/remove-style :height :width)) node)))))
