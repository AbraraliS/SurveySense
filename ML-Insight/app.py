import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
from wordcloud import WordCloud
from sklearn.preprocessing import LabelEncoder
from sklearn.decomposition import PCA
from sklearn.cluster import KMeans
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.ensemble import RandomForestClassifier
import json
import io
import matplotlib.pyplot as plt
import seaborn as sns
import base64
import warnings
warnings.filterwarnings('ignore')

# ----------------------
# Utility Functions
# ----------------------
def load_survey_data(uploaded_file=None):
    if uploaded_file is not None:
        data = json.load(uploaded_file)
    else:
        with open('survey-results-f5ae24e1-9985-450b-b36c-878ffa7f471d.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
    # Special handling for the provided survey JSON structure
    if isinstance(data, dict) and 'responses' in data and 'questions' in data:
        # Map question IDs to text
        qid_to_text = {q['question_id']: q['question_text'] for q in data['questions']}
        qid_to_type = {q['question_id']: q['question_type'] for q in data['questions']}
        records = []
        for resp in data['responses']:
            row = { 'response_id': resp.get('response_id'),
                    'user_id': resp.get('user_id'),
                    'user_name': resp.get('user_name'),
                    'submitted_at': resp.get('submitted_at'),
                    'completion_time': resp.get('completion_time') }
            for qid, answer in resp['responses'].items():
                col_name = qid_to_text.get(qid, qid)
                row[col_name] = answer
            records.append(row)
        return pd.DataFrame(records)
    # Fallback for other structures
    if isinstance(data, dict):
        for key in ['responses', 'data', 'results', 'answers']:
            if key in data:
                records = data[key]
                break
        else:
            records = list(data.values())
    elif isinstance(data, list):
        records = data
    else:
        records = []
    return pd.DataFrame(records)

# ----------------------
# Sidebar
# ----------------------
st.set_page_config(page_title="Survey ML Dashboard", layout="wide")
st.sidebar.title("📊 Survey ML Dashboard")

uploaded_file = st.sidebar.file_uploader("Upload a new survey JSON file", type=["json"])
df = load_survey_data(uploaded_file)

menu = st.sidebar.radio("Navigation", [
    "Overview",
    "MCQ Analytics",
    "Text Feedback (NLP)",
    "Predictive Modeling",
    "Dashboard Summary"
])

# ----------------------
# Overview Section
# ----------------------
def show_overview(df):
    st.title("Overview ✅")
    st.markdown("""
    This section provides a high-level summary of your survey data, including total responses, average completion time, and how responses are distributed over time. Use it to quickly understand participation and engagement trends, and to spot peaks or gaps in response activity.
    """)
    st.write(f"**Total responses:** {len(df)}")
    # Completion rate and time
    time_col = next((col for col in df.columns if 'time' in col.lower() and ('complete' in col.lower() or 'duration' in col.lower())), None)
    # Try to find a date column, fallback to 'submitted_at' if present
    date_col = next((col for col in df.columns if 'date' in col.lower() or 'timestamp' in col.lower()), None)
    if not date_col and 'submitted_at' in df.columns:
        date_col = 'submitted_at'
    if time_col:
        avg_time = df[time_col].dropna().mean()
        st.write(f"**Average completion time:** {avg_time:.1f} seconds")
    else:
        st.write("**Average completion time:** N/A")
    if date_col:
        df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
        daily_counts = df[date_col].dt.date.value_counts().sort_index()
        fig = px.line(x=daily_counts.index, y=daily_counts.values, labels={'x': 'Date', 'y': 'Responses'}, title="Responses Over Time")
        st.plotly_chart(fig, use_container_width=True)
        st.caption("Line chart: Number of survey responses submitted each day.")
    else:
        st.info("No date/timestamp column found.")

# ----------------------
# MCQ Analytics Section
# ----------------------
def show_mcq_analytics(df):
    st.title("MCQ Analytics 📊")
    st.markdown("""
    This section analyzes multiple-choice (MCQ) questions in your survey. It shows how often each answer was chosen, the percentage breakdown, relationships between questions, and clusters of similar respondents. Use it to identify popular and unpopular options, discover patterns and correlations, and segment respondents into groups for targeted insights.
    """)
    from pandas.api.types import is_object_dtype
    mcq_cols = [col for col in df.columns if is_object_dtype(df[col]) and 2 <= df[col].nunique() < 20]
    if not mcq_cols:
        st.warning("No MCQ columns found.")
        return
    for col in mcq_cols:
        counts = df[col].value_counts(dropna=False)
        percentages = df[col].value_counts(normalize=True, dropna=False) * 100
        freq_df = pd.DataFrame({'Count': counts, 'Percentage': percentages.round(2)})
        st.subheader(f"{col}")
        st.markdown(f"Frequency and percentage of each answer for: _{col}_")
        st.dataframe(freq_df)
        fig = px.bar(freq_df.reset_index(), x=col, y='Count', title=f"Bar Chart: {col}")
        st.plotly_chart(fig, use_container_width=True)
        st.caption("Bar chart: Number of responses for each option.")
    # Correlation heatmap
    st.subheader("Correlation Heatmap")
    st.markdown("Shows how answers to different MCQ questions are related. Darker colors mean stronger correlation.")
    try:
        mcq_encoded = df[mcq_cols].apply(lambda x: LabelEncoder().fit_transform(x.astype(str)))
        corr = mcq_encoded.corr()
        fig = px.imshow(corr, text_auto=True, title='Correlation Heatmap of MCQ Questions')
        st.plotly_chart(fig, use_container_width=True)
    except Exception as e:
        st.info(f"Could not plot MCQ correlation heatmap: {e}")
    # Cluster visualization
    st.subheader("Cluster Visualization (2D PCA)")
    st.markdown("Each dot is a respondent, colored by cluster. Clusters group people with similar answer patterns.")
    try:
        encoded = pd.get_dummies(df[mcq_cols], dummy_na=True)
        pca = PCA(n_components=2)
        X_pca = pca.fit_transform(encoded)
        kmeans = KMeans(n_clusters=3, random_state=42)
        clusters = kmeans.fit_predict(encoded)
        fig = px.scatter(x=X_pca[:,0], y=X_pca[:,1], color=clusters.astype(str), labels={'x': 'PC1', 'y': 'PC2', 'color': 'Cluster'}, title="KMeans Clusters (PCA)")
        st.plotly_chart(fig, use_container_width=True)
    except Exception as e:
        st.info(f"Could not plot clusters: {e}")

# ----------------------
# Text Feedback (NLP) Section
# ----------------------
def show_text_feedback(df):
    st.title("Text Feedback (NLP) 💬")
    st.markdown("""
    This section analyzes open-ended (text) feedback using Natural Language Processing (NLP):
    - WordCloud: Most frequent words in feedback.
    - Sentiment: Overall tone (positive/negative/neutral).
    - Topics: Main themes in responses.
    Use it to quickly see what people are talking about and spot common concerns, suggestions, or praise.
    """)
    # Combine all text columns
    text_cols = [col for col in df.columns if any(x in col.lower() for x in ['text', 'feedback', 'comment'])]
    # Only keep text columns that have at least one non-empty value
    text_cols = [col for col in text_cols if df[col].dropna().astype(str).str.strip().replace('nan','').str.len().sum() > 0]
    combined_text = df[text_cols].astype(str).apply(lambda row: ' '.join([v for v in row if v and v.lower() != 'nan']), axis=1) if text_cols else pd.Series(dtype=str)
    if combined_text.empty or combined_text.str.strip().replace('nan','').str.len().sum() == 0:
        st.warning("No text feedback found in any text columns.")
        return
    # WordCloud
    st.subheader("WordCloud of Feedback")
    st.caption("A visual summary of the most common words in all text feedback.")
    all_words = ' '.join(combined_text.dropna().astype(str))
    wordcloud = WordCloud(width=800, height=400, background_color='white').generate(all_words)
    buf = io.BytesIO()
    wordcloud.to_image().save(buf, format='PNG')
    st.image(buf.getvalue())
    # Sentiment (simple rule-based)
    st.subheader("Sentiment Distribution")
    st.caption("Histogram: Distribution of sentiment scores (from negative to positive). Uses VADER sentiment analysis.")
    try:
        from nltk.sentiment import SentimentIntensityAnalyzer
        import nltk
        nltk.download('vader_lexicon', quiet=True)
        sia = SentimentIntensityAnalyzer()
        sentiments = combined_text.dropna().astype(str).apply(lambda x: sia.polarity_scores(x)['compound'])
        fig = px.histogram(sentiments, nbins=20, title="Sentiment Distribution (VADER)")
        st.plotly_chart(fig, use_container_width=True)
    except Exception as e:
        st.info(f"Could not compute sentiment: {e}")
    # Topic modeling (LDA)
    st.subheader("Topic Modeling (Top 5 Topics)")
    st.caption("Top 5 topics extracted from feedback using LDA topic modeling. Each topic is a group of keywords that often appear together.")
    try:
        from sklearn.feature_extraction.text import CountVectorizer
        from sklearn.decomposition import LatentDirichletAllocation
        vectorizer = CountVectorizer(max_df=0.95, min_df=2, stop_words='english')
        dtm = vectorizer.fit_transform(combined_text.dropna().astype(str))
        lda = LatentDirichletAllocation(n_components=5, random_state=42)
        lda.fit(dtm)
        words = vectorizer.get_feature_names_out()
        topics = []
        for idx, topic in enumerate(lda.components_):
            top_words = [words[i] for i in topic.argsort()[-8:][::-1]]
            topics.append(f"Topic {idx+1}: " + ', '.join(top_words))
        for t in topics:
            st.markdown(f"- {t}")
    except Exception as e:
        st.info(f"Could not perform topic modeling: {e}")

# ----------------------
# Predictive Modeling Section
# ----------------------
def show_predictive_modeling(df):
    st.title("Predictive Modeling 🤖")
    st.markdown("""
    This section uses machine learning to predict overall session ratings based on MCQ answers. It shows model performance and which features matter most. Use it to understand what drives high or low ratings and to identify the most important factors for satisfaction.
    """)
    # Identify target
    # Use exact question text for target
    target_col = 'How would you rate the overall quality of the AI/ML session?'
    # Exclude all text columns from features
    text_cols = [col for col in df.columns if any(x in col.lower() for x in ['text', 'feedback', 'comment'])]
    if target_col not in df.columns:
        st.warning("No target column (overall quality) found.")
        return
    feature_cols = [col for col in df.columns if col != target_col and col not in text_cols and df[col].dtype == 'object']
    X_cat = pd.get_dummies(df[feature_cols], dummy_na=True) if feature_cols else pd.DataFrame()
    y = df[target_col].astype(str)
    if X_cat.shape[1] == 0:
        st.warning("No categorical features for modeling.")
        return
    # If only one class, skip modeling
    if len(y.unique()) < 2:
        st.warning("Not enough classes in target for modeling.")
        return
    # Check for minimum samples per class
    class_counts = y.value_counts()
    if (class_counts < 2).any():
        st.warning("Each class in the target must have at least 2 samples for modeling. Current class counts: " + str(class_counts.to_dict()))
        return
    try:
        X_train, X_test, y_train, y_test = train_test_split(X_cat, y, test_size=0.2, random_state=42, stratify=y)
    except ValueError as e:
        st.warning(f"Could not split data for modeling: {e}")
        return
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)
    y_pred = clf.predict(X_test)
    # Classification report
    st.subheader("Classification Report")
    st.caption("Precision, recall, and F1-score for each rating class. Higher values mean better model performance.")
    report = classification_report(y_test, y_pred, output_dict=True)
    st.dataframe(pd.DataFrame(report).transpose())
    # Confusion matrix
    st.subheader("Confusion Matrix")
    st.caption("Matrix showing how often the model predicted each class vs. the true class. Diagonal = correct predictions.")
    cm = confusion_matrix(y_test, y_pred, labels=clf.classes_)
    fig = px.imshow(cm, text_auto=True, x=clf.classes_, y=clf.classes_, color_continuous_scale='Blues', title="Confusion Matrix")
    st.plotly_chart(fig, use_container_width=True)
    # Feature importance
    st.subheader("Feature Importance")
    st.caption("Top 10 most important features (MCQ answers) for predicting the overall rating.")
    importances = clf.feature_importances_
    indices = np.argsort(importances)[-10:][::-1]
    fig = px.bar(x=[X_cat.columns[i] for i in indices], y=importances[indices], labels={'x': 'Feature', 'y': 'Importance'}, title="Top 10 Feature Importances")
    st.plotly_chart(fig, use_container_width=True)

# ----------------------
# Dashboard Summary Section
# ----------------------
def show_dashboard_summary(df):
    st.title("Dashboard Summary 💡")
    st.markdown("""
    This section brings together the most important findings from all analyses, with summary charts and key insights. Use it for a quick executive overview of the survey results and to share highlights with stakeholders.
    """)
    st.markdown("""
    ### Key Findings
    - MCQ clusters reveal distinct respondent groups and preferences.
    - Text feedback highlights main themes and sentiment trends.
    - Predictive modeling identifies top drivers of satisfaction.
    """)
    st.markdown("---")
    st.markdown("#### Executive Summary Charts")
    # Show a few summary charts if possible
    # 1. MCQ cluster plot
    from pandas.api.types import is_object_dtype
    mcq_cols = [col for col in df.columns if is_object_dtype(df[col]) and 2 <= df[col].nunique() < 20]
    if mcq_cols:
        try:
            encoded = pd.get_dummies(df[mcq_cols], dummy_na=True)
            pca = PCA(n_components=2)
            X_pca = pca.fit_transform(encoded)
            kmeans = KMeans(n_clusters=3, random_state=42)
            clusters = kmeans.fit_predict(encoded)
            fig = px.scatter(x=X_pca[:,0], y=X_pca[:,1], color=clusters.astype(str), labels={'x': 'PC1', 'y': 'PC2', 'color': 'Cluster'}, title="KMeans Clusters (PCA)")
            st.plotly_chart(fig, use_container_width=True)
        except Exception:
            pass
    # 2. WordCloud
    text_col = next((col for col in df.columns if any(x in col.lower() for x in ['text', 'feedback', 'comment'])), None)
    if text_col and df[text_col].dropna().astype(str).str.len().sum() > 0:
        all_words = ' '.join(df[text_col].dropna().astype(str))
        wordcloud = WordCloud(width=800, height=400, background_color='white').generate(all_words)
        buf = io.BytesIO()
        wordcloud.to_image().save(buf, format='PNG')
        st.image(buf.getvalue())
    st.markdown("---")
    st.markdown("For full details, see the individual notebook sections.")

# ----------------------
# Main App Logic
# ----------------------
if menu == "Overview":
    show_overview(df)
elif menu == "MCQ Analytics":
    show_mcq_analytics(df)
elif menu == "Text Feedback (NLP)":
    show_text_feedback(df)
elif menu == "Predictive Modeling":
    show_predictive_modeling(df)
elif menu == "Dashboard Summary":
    show_dashboard_summary(df)
