=(ns undef.news
 (:use [undef.pages :only [add-page-init!]])
 (:require [fetch.remotes :as remotes]
  [enfocus.core :as ef])
 (:require-macros [fetch.macros :as fm]
  [enfocus.macros :as em]))

(defn newspage [href & [args]]
 (em/at js/document
  [:#btn_del] (em/listen :click #(if(js/confirm "This will PERMANENTLY erase the article from the database.")
		  (fm/letrem [res (delete_article 1)] (page-click "news" nil)))
  [:#btn_upd] (em/listen :click #(js/alert "Update"))))

(add-page-init! "news" newspage)
