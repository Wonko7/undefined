(ns undef.login
  (:use [undef.pages :only [add-page-init! page-click]]
        [undef.misc :only [show-admin-stuff]])
  (:require [fetch.remotes :as remotes]
            [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
                   [enfocus.macros :as em]))

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

(defn profile-page [href & [args]]
  (em/at js/document
         [:#page :a.logout]    (em/listen :click (fn [e]
                                                   (.preventDefault e)
                                                   (fm/letrem [res (auth-logout)]
                                                     (page-click "news" nil))))
         [:form#update_pass]   (em/listen :submit (fn [e]
                                                    (.preventDefault e)
                                                    ;TODO check that cur pass is good, that both new passes are the same
                                                    (js/console.log "Don't you wish you could update your password?")))
         [:form#update_email]  (em/listen :submit (fn [e]
                                                    (.preventDefault e)
                                                    ;TODO check cur email is valid, check both new emails are the same and valid
                                                    (js/console.log "Don't you wish you could update your email?")))
         [:form#del_account]   (em/listen :submit (fn [e]
                                                    (.preventDefault e)
                                                    ;TODO warn the fucking user
                                                    (js/console.log "Don't you wish you could delete your account?")))))

(add-page-init! "login" login-page)
(add-page-init! "profile" profile-page)
