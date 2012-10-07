(ns undefined.views.projects
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.views.common :only [add-page-init! page project]]
     [undefined.content :only [remove-unsafe-tags str-to-int]]
     [undefined.sql :only [select_projects]]
     [noir.fetch.remotes]))

(defn projects-page [user-id name project-id]
  (let [title       "Undefined's Projects"
        projects    (select_projects)]
    (page title 
          (map #(project (:title %) (:link %) (remove-unsafe-tags (:description %)) (:screenshot %) (when (re-find #"Budget" (:title %)) "restrict-webkit-only"))
               projects))))
;; FIXME restrictions are hardcoded until we decide how to use platforms in db.

(add-page-init! "projects" projects-page)
