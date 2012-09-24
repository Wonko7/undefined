(ns undef.news
		(:use [undef.pages :only [add-page-init! page-click]])
		(:require [fetch.remotes :as remotes]
		 [enfocus.core :as ef])
		(:require-macros [fetch.macros :as fm]
		 [enfocus.macros :as em]))

;TODO remove page click and remove the div instead
(defn newspage [href & [args]]
 (let [uid (em/from (em/select ["#btn_del"]) (em/get-prop :value))]
  (em/at js/document
   [:#btn_del] (em/listen :click #(if(js/confirm "This will PERMANENTLY erase the article from the database.")
		   (fm/letrem [res (delete_article uid)] (page-click "news" nil))))
	   [:#btn_upd] (em/listen :click #(js/alert "Update")))))

 (add-page-init! "news" newspage)
