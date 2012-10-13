(ns undefined.views.newarticle
  (:require [net.cgrand.enlive-html :as html])
  (:use [undefined.views.common :only [add-page-init! page new-article page-404]]
        [undefined.sql :only [select_categories select_authors]]
        [undefined.auth :only [is-admin?]]
        [noir.fetch.remotes]
        [noir.core :only [defpage pre-route]]))

(defn new-article-page [user-id name id]
  (if (is-admin? user-id)
    (page "Add a new post" 
          (new-article (select_authors) (select_categories) nil nil nil nil nil nil) ;TODO auto select current user with auth?
          {:metadata {:data-init-page "new-article"}})
    page-404))

(add-page-init! "new-article" new-article-page)
