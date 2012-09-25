(ns undef.news
  (:require [fetch.remotes :as remotes]
     [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
     [enfocus.macros :as em])
  (:use [undef.pages :only [add-page-init! page-click]]))

(defn reset_div [sel uid]
  (em/at js/document [sel] (em/substitute (str "Reset #" uid " content or update"))))

;TODO find a better way
(defn update_div [sel article]
  (let [title   (:title article)
        body    (:body article)
        uid     (int (:uid article))
        get_labels #(apply str (interpose " " (map %2 %1)))]
    (fm/letrem [tags        (tags_by_article_rem uid)
                authors     (select_authors_rem)
                categories  (select_categories_rem)]
        (em/at js/document
            [sel] (em/html-content
                      (str "<form class=\"newarticle\" style=\"width: 95%; height: 100%; margin: 0px;background-color:#EEFFEE;\">
                           <div>
                           <label for=\"inp_title\">Title: </label><input id=\"inp_title_" uid "\" type=\"text\" value=\""
                        title 
                        "\"></input><span style=\"float: right; color: red;\">Editing post</post>
                        </div>
                        <div>
                        <label for=\"txt_body\">Body: </label><textarea id=\"txt_body_" uid "\" style=\"height: 50%\">"
                        body
                        "</textarea>
                        </div>
                        <div>
                        <label for=\"inp_tags\">Tags: </label><input id=\"inp_tags_" uid "\" type=\"text\" value=\""
                        (get_labels tags :label)
                        "\"></input>
                        <small>TAGS SHOULD BE SEPERATED BY SPACES.</small>
                        </div>
                        <fieldset>
                        <legend>Authors[<b>Coming soon</b>]</legend>
                        <div id=\"cbx_authors\">"
                        (reduce str (map #(str "<input type=\"checkbox\" class=\"cbx_auth\" value=\"" (:uid %) "\">" (:name %) "</input><br/>") authors))
                        "</div>
                        </fieldset>
                        <fieldset>
                        <legend>Categories[<b>Coming soon</b>]</legend>
                        <div id=\"cbx_categories\">"
                        (reduce str (map #(str "<input type=\"checkbox\" class=\"cbx_cat\" value=\"" (:uid %) "\">" (:label %) "</input><br/>") categories))
                        "</div>
                        </fieldset>
                        <div style=\"height: 60px;\">
                        <button type=\"submit\">Update</button>
                        <button type=\"reset\">Reset</button>
                        </div>
                        </form>
                        "))
            [:form] (em/listen :submit (fn [e]
                                         (.preventDefault e)
                                         (let [newtitle (em/from (em/select [(str "#inp_title_" uid)])  (em/get-prop :value))
                                               newbody  (em/from (em/select [(str "#txt_body_" uid)])   (em/get-prop :value))
                                               newtags  (em/from (em/select [(str "#inp_tags_" uid)])   (em/get-prop :value))]
                                           (fm/letrem [res (update_article_rem uid newtitle newbody newtags)]
                                               (page-click "news" nil)))))))))

;TODO remove page click and remove the div instead
(defn newspage [href & [args]]
  (em/at js/document
      [:.btn_del] (em/listen :click (fn [e]
                                      (let [uid (em/from (.-currentTarget e) (em/get-attr :value))]
                                        (if (js/confirm (str "This will PERMANENTLY erase the article #" uid " from the database."))
                                          (fm/letrem [res (delete_article_rem uid)] (page-click "news" nil))))));FIXME don't reload, just delete the div
      [:.btn_upd] (em/listen :click (fn [e]
                                      (let [uid       (int (em/from (.-currentTarget e) (em/get-attr :value)))
                                            artSel    (str ":#article_" uid)]
                                        (fm/letrem [article (select_article_rem uid)]
                                            (update_div artSel (first article))))))))

(add-page-init! "news" newspage)
