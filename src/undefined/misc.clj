(ns undefined.misc
  (:require [net.cgrand.enlive-html :as html]
        [clj-time.coerce :as time-conv]
        [clj-time.format :as time-format]))

(def date-format (time-format/formatter "EEE, dd MMM yyyy HH:mm"))

(defn format-date [sql-date]
  (time-format/unparse date-format (time-conv/from-sql-date sql-date)))
