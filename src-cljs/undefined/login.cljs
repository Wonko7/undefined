(ns undef.login
  (:use [undef.pages :only [add-page-init! page-click]])
  (:require [fetch.remotes :as remotes]
            [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
                   [enfocus.macros :as em]))


(defn login-page [href & [args]]
  (fm/letrem [user (get-user)]
    (if user
      (em/at js/document
             [:#page] (em/html-content (str "Logged in as: " user "<br><a href=\"/logout\" class=\"logout\">Log Out</a>"))
             [:#page :a.logout] (em/listen :click (fn [e]
                                                    (.preventDefault e)
                                                    (fm/letrem [res (auth-logout)]
                                                      (js/console.log res)
                                                      (page-click "news" nil)))))
      (em/at js/document
         ; [:.user] (em/focus)
             [:form] (em/listen :submit (fn [e]
                                          (.preventDefault e)
                                          (let [id (em/from js/document
                                                            :user [:form :input.user] (em/get-prop :value)
                                                            :pass [:form :input.pass] (em/get-prop :value))]
                                            (fm/letrem [user (auth-login id)]
                                              (if user
                                                (page-click "newarticle" nil)
                                                (js/alert (str "log in failed. ")))))))))))

(add-page-init! "login" login-page)
