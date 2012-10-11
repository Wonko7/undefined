(ns undefined.misc
  (:require [net.cgrand.enlive-html :as html]
        [clj-time.coerce :as time-conv]
        [clj-time.format :as time-format]))

(def w3c-date-format (time-format/formatter "yyyy-MM-dd'T'HH:mm:ss'Z'"))
(def date-format (time-format/formatter "EEEE, dd MMMM yyyy - HH:mm"))

(defn format-date [sql-date & [format]]
  (condp = format
    :w3c (time-format/unparse w3c-date-format (time-conv/from-sql-date sql-date))
         (time-format/unparse date-format (time-conv/from-sql-date sql-date))))

(defn get_labels [x y] (apply str (interpose " " (map y x))))

(defn get_keys [m] (keys (select-keys m (for [[k v] m :when (= v true)] k))))

(defn options_list [x c k sel_x]
  (reduce str (map #(str "<input type=\"checkbox\" class=\"" c "\" value=\"" (:uid %) "\""
                         (if (some (fn [y] (= (k %) (k y))) sel_x)
                           "checked=\"CHECKED\"")
                         ">" (k %) "</input><br/>")
                   x)))
