(ns undefined.misc
  (:require [net.cgrand.enlive-html :as html]
            [clojure.string :as string]
            [clj-time.coerce :as time-conv]
            [clj-time.format :as time-format]
            [postal.core :as ps])
  (:use [undefined.config :only [get-config]]))

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

(defn from_html [input] (if input (string/replace input #"<br/>" "\n")))
(defn to_html   [input] (if input (string/replace input #"\n" "<br/>")))

(defn send_email [typ email token]
  (let [subject (case typ
                 :activation  "Welcome to undefined.re, please activate your account"
                 :reset       "Password reset request, undefined.re"
                 :change      "Email update request, undefined.re")
        body    (case typ
                  :activation  (str "<html><head></head><body>"
                                    "Thank you for registering an account at undefined.re,<br><br>"
                                    "follow the link below to activate your account and start posting comments:<br>"
                                    "<a href=\"http://undefined.re/activate/" token  "\">Activate Accout</a>"
                                    "<br>This link will expire in 24 hours."
                                    "<br><br>Regards,<br><br>~The Undefined team."
                                    "</body></html>")
                  :reset       (str "<html><head></head><body>"
                                    "If you haven't requested your password to be reset please ignore this email.<br><br>"
                                    "To reset your password follow the link below<br>"
                                    "<a href=\"http://undefined.re/reset/" token  "\">Confirm Password Reset</a>"
                                    "<br>This link will expire in 24 hours."
                                    "<br><br>Regards,<br><br>~The Undefined team."
                                    "</body></html>")
                  :change      (str "<html><head></head><body>"
                                    "If you haven't requested your email to be changed please ignore this email.<br><br>"
                                    "To confirm your new email address follow the link below<br>"
                                    "<a href=\"http://undefined.re/update/" token  "\">Confirm Email Update</a>"
                                    "<br>This link will expire in 24 hours."
                                    "<br><br>Regards,<br><br>~The Undefined team."
                                    "</body></html>"))
        smtp_pass (:smtp_pass (get-config))]
    (ps/send-message ^{:host  "localhost"
                       :user  "do-not-reply"
                       :pass  (if smtp_pass smtp_pass "placeholder")}
                     {:from     "no-reply@undefined.re"
                      :to       email
                      :subject  subject
                      :body     [{:type "text/html"
                                  :content body}]})))
