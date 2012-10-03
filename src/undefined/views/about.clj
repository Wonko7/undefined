(ns undefined.views.about
  (:use [undefined.views.common :only [base page about add-page-init!]]))


(defn about-page [user-id name & [args]]
  (page "About Undefined"
        (about)
        {:metadata {:data-init-page "about"}}))

(add-page-init! "about" about-page)
