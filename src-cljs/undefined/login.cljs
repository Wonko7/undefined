(ns undef.login
  (:use [undef.pages :only [add-page-init! page-click]]
        [undef.misc :only [show-admin-stuff]]
        [undef.misc :only [restore-height]])
  (:require [fetch.remotes :as remotes]
            [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
                   [enfocus.macros :as em]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;    pages;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defn update-valid-button []
  (let [vals (em/from js/document
                      :a [:#inp_usr]   (em/get-attr :class)
                      :b [:#new_pass]  (em/get-attr :class)
                      :c [:#conf_pass] (em/get-attr :class)
                      :d [:#new_email] (em/get-attr :class))
        valid? (->> vals
                 (filter (fn [[k v]] (= "valid-inp" v)))
                 (count)
                 (= 4))]
    (if valid?
      (em/at js/document [:#submit-sign-up] (em/do->
                                              (em/remove-attr :disabled)
                                              (em/add-class "valid-sub")
                                              (em/remove-class "invalid-sub")))
      (em/at js/document [:#submit-sign-up] (em/do->
                                              (em/set-attr :disabled "disabled")
                                              (em/add-class "invalid-sub")
                                              (em/remove-class "valid-sub"))))))

(defn validate-deco [elt valid?]
  (if valid?
    (em/at elt (em/do-> (em/add-class "valid-inp")
                        (em/remove-class "invalid-inp")))
    (em/at elt (em/do-> (em/add-class "invalid-inp")
                        (em/remove-class "valid-inp"))))
  (update-valid-button))

(defn val-username [e]
  (let [inp (.-currentTarget e)
        val (em/from inp (em/get-prop :value))]
    (validate-deco inp (and (>= (.-length val) 3) (nil? (re-find #"\s+" val))))))

(defn val-pass2 [e]
  (let [inp             (em/select js/document [:#conf_pass])
        {:keys [p1 p2]} (em/from js/document
                                 :p1 [:#new_pass]  (em/get-prop :value)
                                 :p2 [:#conf_pass] (em/get-prop :value))]
    (validate-deco inp (and (> (.-length p2) 0) (= p1 p2)))))

(defn val-pass1 [e]
  (let [inp (.-currentTarget e)
        val (em/from inp (em/get-prop :value))]
    (validate-deco inp (>= (.-length val) 8))
    (val-pass2 nil)))

(defn val-email [e]
  (let [inp (.-currentTarget e)
        val (em/from inp (em/get-prop :value))]
    (validate-deco inp (re-find #"^\w\S*@\w\S*[.]\S+$" val))))

(defn submit-sign-up [e]
  (.preventDefault e)
  (let [{:keys [user pass mail]} (em/from js/document
                                          :user [:#inp_usr]   (em/get-prop :value)
                                          :pass [:#new_pass]  (em/get-prop :value)
                                          :mail [:#new_email] (em/get-prop :value))]
    (fm/letrem [result (sign-up-rem user mail pass)]
      (em/at js/document
             [:#sign-up-form] (em/chain (em/resize :curwidth 0 200)
                                        (em/html-content result)
                                        (restore-height 200))))))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;    pages;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defn sign-up-page [href & [args]]
  (em/at js/document
         [:#inp_usr]      (em/listen :input val-username)
         [:#new_pass]     (em/listen :input val-pass1)
         [:#conf_pass]    (em/listen :input val-pass2)
         [:#new_email]    (em/listen :input val-email)
         [:#sign-up-form] (em/listen :submit submit-sign-up)))

(defn login-page [href & [args]]
  (em/at js/document
         [:#inp_usr]     (em/focus)
         [:#reset_pass]  (em/listen :click (fn [e]
                                             (.preventDefault e)
                                             (let [username (em/from (em/select [:#inp_usr]) (em/get-prop :value))]
                                               (if (js/confirm (str "Are you sure you want to reset your password?"))
                                                 (fm/letrem [res (reset_pass_rem username)]
                                                   (js/alert res))))))
         [:form]         (em/listen :submit (fn [e]
                                              (.preventDefault e)
                                              (let [id (em/from js/document
                                                                :user [:form :input.user] (em/get-prop :value)
                                                                :pass [:form :input.pass] (em/get-prop :value))]
                                                (fm/letrem [[user roles] (auth-login id)]
                                                  (if user
                                                    (page-click "news" nil)
                                                    (js/alert (str "log in failed. ")))))))))


;TODO add validation for submit button
(defn profile-page [href & [args]]
  (let [update-password   (fn [e]
                            (.preventDefault e)
                            (let  [newpass  (em/from js/document
                                                     :first    [:#new_pass]  (em/get-prop :value)
                                                     :second   [:#conf_pass] (em/get-prop :value)
                                                     :old      [:#cur_pass]  (em/get-prop :value))]
                              (fm/letrem  [id (get-user)]
                                (if (= (:first newpass) (:second newpass))
                                  (fm/letrem [res (update_pass_rem "Grimskunk" (:old newpass) (:first newpass))]
                                    (js/alert res))
                                  (js/alert "The passwords don't match.")))))]

    (em/at js/document
           [:#new_pass]           (em/listen :input val-pass1)
           [:#conf_pass]          (em/listen :input val-pass2)
           [:#page :a.logout]     (em/listen :click (fn [e]
                                                      (.preventDefault e)
                                                      (fm/letrem [res (auth-logout)]
                                                        (page-click "news" nil))))
           [:form#update_pass]    (em/listen :submit #(update-password %))
           [:form#update_email]   (em/listen :submit (fn [e]
                                                       (.preventDefault e)
                                                       ;TODO check cur email is valid, check both new emails are the same and valid
                                                       (js/console.log "Don't you wish you could update your email?")))
           [:form#del_account]    (em/listen :submit (fn [e]
                                                       (.preventDefault e)
                                                       ;TODO warn the fucking user
                                                       (js/console.log "Don't you wish you could delete your account?"))))))


(add-page-init! "login" login-page)
(add-page-init! "profile" profile-page)
(add-page-init! "sign-up" sign-up-page)
