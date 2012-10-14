(ns undefined.views.login
  (:use [undefined.views.common :only [base page login profile add-page-init!]]
        [undefined.auth :only [username]]))

;FIXME find a way to save password for chrome/safari
(defn login-page [user-id name & [args]]
  (page "Log In:"
        (if user-id
          (profile)
          (login))
        {:metadata {:data-init-page "login"}}))

(add-page-init! "login" login-page)
