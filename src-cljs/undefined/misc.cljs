(ns undef.misc
  (:require-macros [fetch.macros :as fm]
                   [enfocus.macros :as em])           
  (:require [fetch.remotes :as remotes]
            [enfocus.core :as ef]))

(defn show-admin-stuff []
  (fm/letrem [[user roles] (get-user)] 
    ;; (js/console.log (str roles)) ;; FIXME not sure if bug or just slow...
    (em/at js/document
           [:.admin] (if (:undefined.server/admin roles)
                       (em/remove-class "hidden")
                       (em/add-class "hidden")))))
