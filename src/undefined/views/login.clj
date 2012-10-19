(ns undefined.views.login
  (:use [undefined.views.common :only [base page login profile sign-up add-page-init!]]
        [undefined.auth :only [username userid captcha-check]]
        [undefined.sql :only [create_temp_user get_user]]
        [noir.fetch.remotes])
  (:require [noir.session :as session]))

;FIXME find a way to save password for chrome/safari
(defn login-page [user-id name & [args]]
  (if user-id
    (page (username user-id)
          (profile (username user-id) (:email (first (get_user :id (userid user-id)))))
          {:metadata {:data-init-page "profile"
                      :data-init-args (username user-id)}})
    (page "Log In:"
          (login)
          {:metadata {:data-init-page "login"}})))

(defn logout-redirect [user-id name & [args]]
  (page "Logging out"
        (login)
        {:metadata {:data-init-page "logout"}}))

(defn sign-up-page [user-id href & [args]]
  (page "Sign up:"
        (sign-up)
        {:metadata {:data-init-page "sign-up"}}))

(defremote sign-up-rem [captcha user mail pass]
  (if (not (captcha-check captcha (session/get :captcha)))
    "You tried to cheat the sentience test."
    (let [res (create_temp_user user mail pass)]
      (if (= 0 res)
        res
        (str "<div>" res "</div>")))))

(add-page-init! "logout" logout-redirect)
(add-page-init! "login" login-page)
(add-page-init! "sign-up" sign-up-page)
