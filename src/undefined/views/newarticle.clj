(ns undefined.views.newarticle
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.views.common :only [add-page-init! page newarticle page-404]]
     [undefined.sql :only [select_categories select_authors]]
     [undefined.auth :only [is-admin?]]
     [noir.fetch.remotes]
     [noir.core :only [defpage pre-route]]))

(defn new-article-page [name id]
  (if (is-admin?)
    (page "Add a new post" 
          (newarticle (select_authors) (select_categories) nil nil nil nil nil nil) ;TODO auto select current user with auth?
          {:metadata {:data-init-page "newarticle"}})
    page-404))

(add-page-init! "newarticle" new-article-page)
