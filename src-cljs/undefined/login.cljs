(ns undef.login
  (:use [undef.pages :only [add-page-init! page-click]]
        [undef.misc :only [show-admin-stuff]])
  (:require [fetch.remotes :as remotes]
     [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
     [enfocus.macros :as em]))

(defn login-page [href & [args]]
      (em/at js/document
             [:#page :a.logout] (em/listen :click (fn [e]
                                                    (.preventDefault e)
                                                    (fm/letrem [res (auth-logout)]
                                                      (page-click "news" nil))))
             [:#inp_usr] (em/focus)
             [:form] (em/listen :submit (fn [e]
                                          (.preventDefault e)
                                          (let [id (em/from js/document
                                                            :user [:form :input.user] (em/get-prop :value)
                                                            :pass [:form :input.pass] (em/get-prop :value))]
                                            (fm/letrem [[user roles] (auth-login id)]
                                              (if user
                                                (page-click "new-article" nil)
                                                (js/alert (str "log in failed. ")))))))))

(add-page-init! "login" login-page)
