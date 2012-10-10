(ns undefined.views.login
  (:use [undefined.views.common :only [base page login add-page-init!]]
        [undefined.auth :only [username]]))

;FIXME find a way to save password for chrome/safari
(defn login-page [user-id name & [args]]
  (page "Log In:"
        (if user-id
          {:tag :div :attrs {:class "whole-article"}
           :content [{:tag :div :attrs {:class "article"}
                      :content [(str "Logged in as: " (username user-id))
                                {:tag :br}
                                {:tag :a :attrs {:class "logout" :href "logout"} :content "Log Out"}]}]}
          (login))
        {:metadata {:data-init-page "login"}}))

(add-page-init! "login" login-page)
