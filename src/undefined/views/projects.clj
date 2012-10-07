(ns undefined.views.projects
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.views.common :only [add-page-init! page product]]
     [undefined.content :only [remove-unsafe-tags str-to-int]]
     [undefined.sql :only [select_projects]]
     [noir.fetch.remotes]))

(defn projects-page [user-id name product-id]
  (let [title       "Undefined's projects"
        projects    (select_projects)]
    (page title 
          (map #(product (:title %) (:link %) (remove-unsafe-tags (:description %)) (:screenshot %) (when (re-find #"Budget" (:title %)) "restrict-webkit-only"))
               projects))))
;; FIXME restrictions are hardcoded until we decide how to use platforms in db.

(add-page-init! "projects" projects-page)
