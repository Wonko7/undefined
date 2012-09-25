(ns undef.news
  (:require [fetch.remotes :as remotes]
     [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
     [enfocus.macros :as em])
  (:use [undef.pages :only [add-page-init! page-click]]))

(em/defaction update_div [uid sel article]
    [sel] (em/html-content (str "
                             <form class=\"newarticle\">
                                <div>
                                <label for=\"inp_title\">Title: </label><input id=\"inp_title\" type=\"text\"></input>
                                </div>
                                <div>
                                <label for=\"txt_body\">Body: </label><textarea id=\"txt_body\"></textarea>
                                </div>
                                <div>
                                <label for=\"inp_tags\">Tags: </label><input id=\"inp_tags\" type=\"text\"></input>
                                <small>TAGS SHOULD BE SEPERATED BY SPACES.</small>
                                </div>
                                <fieldset>
                                <legend>Authors</legend>
                                <div id=\"cbx_authors\"></div>
                                </fieldset>
                                <fieldset>
                                <legend>Categories</legend>
                                <div id=\"cbx_categories\"></div>
                                </fieldset>
                                <div style=\"height: 60px;\">
                                <button type=\"submit\" id=\"btn_add_article\">Submit</button>
                                <button type=\"reset\" id=\"btn_rst\">Reset</button>
                                </div>
                                </form>
                                ")))

;TODO remove page click and remove the div instead
(defn newspage [href & [args]]
  (em/at js/document
      [:.btn_del] (em/listen :click (fn [e]
                                      (let [uid (em/from (.-currentTarget e) (em/get-attr :value))]
                                        (if (js/confirm (str "This will PERMANENTLY erase the article #" uid " from the database."))
                                          (fm/letrem [res (delete_article uid)] (js/alert res))))));(page-click "news" nil))))))
      [:.btn_upd] (em/listen :click (fn [e]
                                      (let [uid       (em/from (.-currentTarget e) (em/get-attr :value))
                                            artSel    (str ":#article_" uid)]
                                        (fm/letrem [article (select_article uid)]
                                            (update_div uid artSel article)))))))

(add-page-init! "news" newspage)
