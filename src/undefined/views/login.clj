(ns undefined.views.login
  (:use [undefined.views.common :only [base page login add-page-init!]]))

;FIXME find a way to save password for chrome/safari
(defn login-page [name & [args]]
  (page "Log In:"
        (login)
        {:metadata {:data-init-page "login"}}))

(add-page-init! "login" login-page)
