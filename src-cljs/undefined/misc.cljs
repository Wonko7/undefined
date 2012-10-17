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
;;       this should be extendend to support multiple children on the node. --> add all children w/ same style to a div outside the screen?
(defn restore-height [speed]
  (ef/chainable-standard
    (fn [node]
      (let [h (:size (em/from [node]
                              :size [:> :*] (fn [child]
                                              (let [+-bot-top   #(+ (.-top %1) (.-bottom %1))
                                                    marg (+-bot-top ((ef/extr-multi-node style/getPaddingBox) child))
                                                    bord (+-bot-top ((ef/extr-multi-node style/getBorderBox) child))
                                                    size (.-height  ((ef/extr-multi-node style/getSize) child))]
                                                (+ marg bord size)))))]
        ((em/chain (em/resize :curwidth h speed)
                   (em/remove-style :height :width)) [node])))))

;((ef/extr-multi-node #(js/console.log %1 (str %1))) child )

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Request loading feedback ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(em/defaction start-load [content button]
  [button]  (em/set-attr :disabled "disabled")
  [content] (em/html-content "<img src='/img/loading.gif'></img>"))

(em/defaction stop-load [content button result]
  [button]  (em/remove-attr :disabled)
  [content] (em/content result))

;;;;;;;;;;;;;;;;;;;;;
;; Form validation ;;
;;;;;;;;;;;;;;;;;;;;;

(defn mk-validate-deco [submit-sel val-sels]
  (let [nb-vals (count val-sels)]
    (fn [elt valid?]
      (if valid?
        (em/at elt (em/do-> (em/add-class "valid-inp")
                            (em/remove-class "invalid-inp")))
        (em/at elt (em/do-> (em/add-class "invalid-inp")
                            (em/remove-class "valid-inp"))))
      (let [vals (em/from js/document
                          :#inp_usr   [:#inp_usr]   (em/get-attr :class)
                          :#cur_pass1 [:#cur_pass1] (em/get-attr :class)
                          :#cur_pass2 [:#cur_pass2] (em/get-attr :class)
                          :#cur_pass3 [:#cur_pass3] (em/get-attr :class)
                          :#new_pass  [:#new_pass]  (em/get-attr :class)
                          :#conf_pass [:#conf_pass] (em/get-attr :class)
                          :#new_email [:#new_email] (em/get-attr :class))
            valid? (->> vals
                     (filter (fn [[k v]] (and (k val-sels) (= "valid-inp" v))))
                     (count)
                     (= nb-vals))]
        (if valid?
          (em/at js/document [submit-sel] (em/do->
                                            (em/remove-attr :disabled)
                                            (em/add-class "valid-sub")
                                            (em/remove-class "invalid-sub")))
          (em/at js/document [submit-sel] (em/do->
                                            (em/set-attr :disabled "disabled")
                                            (em/add-class "invalid-sub")
                                            (em/remove-class "valid-sub"))))))))

(defn mk-pass-val [validator & [pass2-val]]
  (if pass2-val
    (fn [e]
      (let [inp (.-currentTarget e)
            val (em/from inp (em/get-prop :value))]
        (validator inp (>= (.-length val) 8))
        (pass2-val nil)))
    (fn [e]
      (let [inp (.-currentTarget e)
            val (em/from inp (em/get-prop :value))]
        (validator inp (>= (.-length val) 8))))))

;; pass1 should be mk-pass2-val's listener id.
(defn mk-pass2-val [pass1 pass2 validator]
  (fn [e]
    (let [inp             (em/select js/document [pass1])
          {:keys [p1 p2]} (em/from js/document
                                   :p1 [pass1] (em/get-prop :value)
                                   :p2 [pass2] (em/get-prop :value))]
      (validator inp (and (> (.-length p2) 0) (= p1 p2))))))

(defn mk-email-val [validator]
  (fn [e]
    (let [inp (.-currentTarget e)
          val (em/from inp (em/get-prop :value))]
      (validator inp (re-find #"^\w\S*@\w\S*\.\S+$" val)))))

(defn mk-user-val [validator]
  (fn [e]
    (let [inp (.-currentTarget e)
          val (em/from inp (em/get-prop :value))]
      (validator inp (and (>= (.-length val) 3) (nil? (re-find #"\s+" val)))))))
