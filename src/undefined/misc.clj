(ns undefined.misc
  (:require [net.cgrand.enlive-html :as html]
            [clojure.string :as string]
            [clj-time.coerce :as time-conv]
            [clj-time.format :as time-format]
            [postal.core :as ps])
  (:use [undefined.config :only [get-conf]]))

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

(defn send_activation [email act]
  (let [smtp_pass (get-conf :smtp_pass)]
    (ps/send-message ^{:host "smtp.gmail.com"
                       :user "landolphia@undefined.re"
                       :pass (if smtp_pass smtp_pass "placeholder")
                       :ssl :yes!!!11}
                     {:from "defined@undefined.re"
                      :to email
                      :subject "Welcome to undefined.re, please activate your account"
                      :body (str "Thank you for registering an account at undefined.re,\n\nfollow the link below to activate your account and start posting comments\n"
                                 "http://localhost:8000/activate/" act ;;FIXME use get conf for domain name
                                 "\nThis link will expire in 24 hours."
                                 "\n\nRegards,\n\n~The Undefined team.")})))

(defn send_reset_pass [email resetlink]
  (let [smtp_pass (get-conf :smtp_pass)]
    (ps/send-message ^{:host "smtp.gmail.com"
                       :user "landolphia@undefined.re"
                       :pass (if smtp_pass smtp_pass "placeholder")
                       :ssl :yes!!!11}
                     {:from "defined@undefined.re"
                      :to email
                      :subject "Password reset request, undefined.re"
                      :body (str "If you haven't requested your password to be reset please ignore this email.\n\n"
                                 "To reset your password follow the link below\n"
                                 "http://undefined.re/reset/" resetlink
                                 "\nThis link will expire in 24 hours."
                                 "\n\nRegards,\n\n~The Undefined team.")})))

(defn send_change_email [email updatelink]
  (let [smtp_pass (get-conf :smtp_pass)]
    (ps/send-message ^{:host "smtp.gmail.com"
                       :user "landolphia@undefined.re"
                       :pass (if smtp_pass smtp_pass "placeholder")
                       :ssl :yes!!!11}
                     {:from "defined@undefined.re"
                      :to email
                      :subject "Email update request, undefined.re"
                      :body (str "If you haven't requested your email to be changed please ignore this email.\n\n"
                                 "To confirm your new email address follow the link below\n"
                                 "http://undefined.re/update/" updatelink
                                 "\nThis link will expire in 24 hours."
                                 "\n\nRegards,\n\n~The Undefined team.")})))
