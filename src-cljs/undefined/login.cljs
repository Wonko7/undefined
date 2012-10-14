(ns undef.login
  (:use [undef.pages :only [add-page-init! page-click]]
        [undef.misc :only [show-admin-stuff]])
  (:require [fetch.remotes :as remotes]
            [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
                   [enfocus.macros :as em]))

(defn login-page [href & [args]]
  (let [login #(em/at js/document
                      [:#inp_usr]     (em/focus)
                      [:#reset_pass]  (em/listen :click (fn [e]
                                                          (.preventDefault e)
                                                          (js/alert "Blaerliqjwrpqwnir")))
                      [:form]         (em/listen :submit (fn [e]
                                                   (.preventDefault e)
                                                   (let [id (em/from js/document
                                                                     :user [:form :input.user] (em/get-prop :value)
                                                                     :pass [:form :input.pass] (em/get-prop :value))]
                                                     (fm/letrem [[user roles] (auth-login id)]
                                                       (if user
                                                         (page-click "news" nil)
                                                         (js/alert (str "log in failed. "))))))))
        profile #(em/at js/document
                        [:#page :a.logout] (em/listen :click (fn [e]
                                                               (.preventDefault e)
                                                               (fm/letrem [res (auth-logout)]
                                                                 (page-click "news" nil)))))]
    (fm/letrem [[user roles] (get-user)]
      (if user
        (profile)
        (login)))))

(add-page-init! "login" login-page)
