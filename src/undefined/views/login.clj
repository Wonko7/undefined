(ns undefined.views.login
  (:use [noir.core :only [defpage]]
        [undefined.views.common :only [base page login metadata]]))


;; FIXME: add-page-init! finally.
(defpage "/login" []
   (base (page "Log In:"
              (login)
              {:metadata {:data-init-page "login"}})))
