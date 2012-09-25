(ns undef.news
  (:require [fetch.remotes :as remotes]
     [enfocus.core :as ef])
  (:require-macros [fetch.macros :as fm]
     [enfocus.macros :as em])
  (:use [undef.pages :only [add-page-init! page-click]]))

(defn reset_div [sel uid]
  (em/at js/document [sel] (em/html-content (str "Reset #" uid " content or update"))))

(defn update_div [sel article]
  (let [title   (:title article)
        body    (:body article)
        uid     (int (:uid article))
        get_labels #(apply str (interpose " " (map %2 %1)))]
    (fm/letrem [tags   (tags_by_article_rem uid)]
        (em/at js/document
            [sel] (em/html-content
                      (str "<form class=\"newarticle\" style=\"width: 800px; margin: 0px;\">
                           <div>
                           <label for=\"inp_title\">Title: </label><input id=\"inp_title\" type=\"text\" value=\""
                        title 
                        "\"></input>
                        </div>
                        <div>
                        <label for=\"txt_body\">Body: </label><textarea id=\"txt_body\">"
                        body
                        "</textarea>
                        </div>
                        <div>
                        <label for=\"inp_tags\">Tags: </label><input id=\"inp_tags\" type=\"text\" value=\""
                        (get_labels tags :label)
                        "\"></input>
                        <small>TAGS SHOULD BE SEPERATED BY SPACES.</small>
                        </div>
                        <fieldset>
                        <legend>Authors[<b>Coming soon</b>]</legend>
                        <div id=\"cbx_authors\"></div>
                        </fieldset>
                        <fieldset>
                        <legend>Categories[<b>Coming soon</b>]</legend>
                        <div id=\"cbx_categories\"></div>
                        </fieldset>
                        <div style=\"height: 60px;\">
                        <button type=\"submit\">Update</button>
                        <button type=\"reset\">Reset</button>
                        </div>
                        </form>
                        "))
            ;            [:#btn_live_update] (em/listen :click #(let [newtitle (em/from (em/select ["#inp_title"]) (em/get-prop :value))
            ;                                                        newbody  (em/from (em/select ["#txt_body"]) (em/get-prop :value))]
            ;                                                   (fm/letrem [res (update_article uid newtitle newbody)]
            ;                                                     (do (js/alert tags) (page-click "news" nil)))))
            [:form] (em/listen :submit (fn [e]
                                           (.preventDefault e)
                                           (reset_div sel uid)))))))

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
