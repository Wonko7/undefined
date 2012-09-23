(ns undefined.views.login
  (:use [noir.core :only [defpage]]
        [undefined.views.common :only [base page login metadata add-page-init!]]))


(defn login-page [name & [args]]
  (page "Log In:"
        (login)
        {:metadata {:data-init-page "login"}}))

(add-page-init! "login" login-page)
