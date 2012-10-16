(ns undef.login
  (:use [undef.pages :only [add-page-init! page-click]]
        [undef.misc :only [show-admin-stuff]]
        [undef.misc :only [restore-height]])
  (:require [fetch.remotes :as remotes]
            [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
                   [enfocus.macros :as em]))


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;    Helpers;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

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


;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;    pages;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(defn sign-up-page [href & [args]]
  (let [;; validators;
        submit-validator (mk-validate-deco :#submit-sign-up #{:#inp_usr :#new_pass :#conf_pass :#new_email})
        pass2-val        (mk-pass2-val :#conf_pass :#new_pass submit-validator)
        ;; form submit;
        submit-sign-up   (fn [e]
                           (.preventDefault e)
                           (let [{:keys [user pass mail]} (em/from js/document
                                                                   :user [:#inp_usr]   (em/get-prop :value)
                                                                   :pass [:#new_pass]  (em/get-prop :value)
                                                                   :mail [:#new_email] (em/get-prop :value))]
                             (fm/letrem [result (sign-up-rem user mail pass)]
                               (em/at js/document
                                      [:#sign-up-form] (em/chain (em/resize :curwidth 0 200)
                                                                 (em/html-content result)
                                                                 (restore-height 200))))))]
    (em/at js/document
           [:#inp_usr]      (em/listen :input (mk-user-val submit-validator))
           [:#new_pass]     (em/listen :input (mk-pass-val submit-validator pass2-val))
           [:#conf_pass]    (em/listen :input pass2-val)
           [:#new_email]    (em/listen :input (mk-pass-val submit-validator))
           [:#sign-up-form] (em/listen :submit submit-sign-up))))

(defn login-page [href & [args]]
  (em/at js/document
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


(defn profile-page [href & [args]]
  (let [update-password          (fn [e]
                                   (.preventDefault e)
                                   (let  [newpass  (em/from js/document
                                                            :first    [:#new_pass]  (em/get-prop :value)
                                                            :second   [:#conf_pass] (em/get-prop :value)
                                                            :old      [:#cur_pass1] (em/get-prop :value))]
                                     (fm/letrem  [[username roles] (get-user)
                                                  res (update_pass_rem username (:old newpass) (:first newpass))]
                                       (js/alert res))))
        update-email             (fn [e]
                                   (.preventDefault e)
                                   (let  [newemail (em/from js/document
                                                            :first   [:#new_email]   (em/get-prop :value)
                                                            :second  [:#conf_email]  (em/get-prop :value)
                                                            :pass    [:#cur_pass2]    (em/get-prop :value))]
                                     (fm/letrem [[username roles] (get-user)
                                                 res (request_email_token_rem username (:pass newemail) (:first newemail))]
                                       (js/alert res))))
        delete-account           (fn [e]
                                   nil) 
        ;; validators;
        email-submit-validator   (mk-validate-deco :#submit-email #{:#new_email :#cur_pass2})
        pass-submit-validator    (mk-validate-deco :#submit-pass  #{:#cur_pass1 :#new_pass :#conf_pass})
        del-submit-validator     (mk-validate-deco :#submit-del   #{:#cur_pass3})
        pass2-val                (mk-pass2-val :#conf_pass :#new_pass pass-submit-validator)]
    (em/at js/document
           ;; email validation;
           [:#cur_pass2]    (em/listen :input (mk-pass-val email-submit-validator))
           [:#new_email]    (em/listen :input (mk-email-val email-submit-validator))
           ;; password validation;
           [:#cur_pass1]    (em/listen :input (mk-pass-val pass-submit-validator))
           [:#new_pass]     (em/listen :input (mk-pass-val pass-submit-validator pass2-val))
           [:#conf_pass]    (em/listen :input pass2-val)
           ;; delete validation;
           [:#cur_pass3]    (em/listen :input (mk-pass-val del-submit-validator))
           ;; forms;
           [:#page :a.logout]     (em/listen :click (fn [e]
                                                      (.preventDefault e)
                                                      (fm/letrem [res (auth-logout)]
                                                        (page-click "news" nil))))
           [:form#update_pass]    (em/listen :submit #(update-password %))
           [:form#update_email]   (em/listen :submit #(update-email %))
           [:form#del_account]    (em/listen :submit (fn [e]
                                                       (.preventDefault e)
                                                       ;TODO warn the fucking user and log him out
                                                       (js/console.log "Don't you wish you could delete your account?"))))))


(add-page-init! "login" login-page)
(add-page-init! "profile" profile-page)
(add-page-init! "sign-up" sign-up-page)
