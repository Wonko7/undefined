(ns undefined.views.login
  (:use [undefined.views.common :only [base page login profile add-page-init!]]
        [undefined.auth :only [username useremail]]))

;FIXME find a way to save password for chrome/safari
(defn login-page [user-id name & [args]]
  (if user-id
    (page (username user-id)
          (profile (username user-id) (useremail user-id))
          {:metadata {:data-init-page "profile"
                      :data-init-args (username user-id)}})
    (page "Log In:"
          (login)
          {:metadata {:data-init-page "login"}})))

(add-page-init! "login" login-page)
