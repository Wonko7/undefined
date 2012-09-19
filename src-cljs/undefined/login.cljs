(ns undef.login
  (:use [undef.pages :only [add-page-init!]])
  (:require [fetch.remotes :as remotes]
            [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
                   [enfocus.macros :as em]))


(defn login-page [href & [args]]
  (fm/letrem [user (get-user)]
    (js/console.log "hello, login page loaded: " user)
    (if user
      (em/at js/document
             [:#page] (em/html-content (str "Logged in as: " user "<br><a href=\"/logout\">Log Out</a>")))
      (em/at js/document
             [:form] (em/listen :submit (fn [e]
                                          (js/console.log "I'm heeere")
                                          (.preventDefault e)
                                          (let [id (em/from js/document
                                                            :user [:form :input.user] (em/get-prop :value)
                                                            :pass [:form :input.pass] (em/get-prop :value))]
                                            (js/console.log (str "try to log with: " id))
                                            (fm/letrem [user (auth-login id)]
                                              (if user
                                                (js/console.log (str "logged in as: " user)
                                                (js/console.log (str "log in failed. "))))))))))))

(add-page-init! "login" login-page)
