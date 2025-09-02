# %% [markdown]
# # Survey Analytics Visualization
# 
# This notebook provides summary statistics and interactive visualizations for survey data, including MCQ analysis, text response insights, and sentiment trends.

# %% [markdown]
# ## 1. Import Required Libraries
# We will use pandas, numpy, matplotlib, seaborn, plotly, wordcloud, and optionally streamlit for interactive dashboarding.

# %%
# Import required libraries
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
from wordcloud import WordCloud
import json
import warnings
warnings.filterwarnings('ignore')

# Optional: Streamlit for dashboarding
try:
    import streamlit as st
except ImportError:
    st = None

# %% [markdown]
# ## 2. Load Survey Responses from JSON
# We will load the survey responses from the JSON file (`survey-results.json`).

# %%
# Load the survey data from JSON file
with open('survey-results-f5ae24e1-9985-450b-b36c-878ffa7f471d.json', 'r', encoding='utf-8') as f:
    survey_data = json.load(f)

def extract_records(survey_data):
    if isinstance(survey_data, dict):
        for key in ['responses', 'data', 'results', 'answers']:
            if key in survey_data:
                records = survey_data[key]
                break
        else:
            records = list(survey_data.values())
    elif isinstance(survey_data, list):
        records = survey_data
    else:
        records = []
    return pd.DataFrame(records)

df = extract_records(survey_data)
if st:
    st.write('Columns:', df.columns.tolist())
    st.dataframe(df.head())
else:
    print('Columns:', df.columns.tolist())
    print(df.head())

# %% [markdown]
# ## 3. Summary Statistics
# We will compute total responses, completion time distribution, and response count per day.

# %%
# Summary statistics
if st:
    st.write('Total responses:', len(df))
else:
    print('Total responses:', len(df))

# Completion time distribution (if available)
time_col = None
for col in df.columns:
    if 'time' in col.lower() and ('complete' in col.lower() or 'duration' in col.lower()):
        time_col = col
        break
if time_col:
    if st:
        import plotly.express as px
        st.plotly_chart(px.histogram(df, x=time_col, nbins=20, title='Completion Time Distribution'))
    else:
        plt.figure(figsize=(6, 4))
        sns.histplot(df[time_col].dropna(), bins=20, kde=True)
        plt.title('Completion Time Distribution')
        plt.xlabel('Completion Time (seconds)')
        plt.ylabel('Count')
        plt.show()
else:
    print('No completion time column found.')

# Response count per day (if timestamp available)
date_col = None
for col in df.columns:
    if 'date' in col.lower() or 'timestamp' in col.lower():
        date_col = col
        break
if date_col:
    df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
    daily_counts = df[date_col].dt.date.value_counts().sort_index()
    if st:
        st.bar_chart(daily_counts)
    else:
        plt.figure(figsize=(8, 4))
        daily_counts.plot(kind='bar')
        plt.title('Response Count per Day')
        plt.xlabel('Date')
        plt.ylabel('Responses')
        plt.show()
else:
    print('No date/timestamp column found.')

# %% [markdown]
# ## 4. Visualizations
# We will create bar charts for MCQ answers, a heatmap for MCQ correlations, a WordCloud for text responses, and a sentiment trend over time.

# %%
# Bar charts for MCQ answers
from pandas.api.types import is_object_dtype
mcq_cols = []
for col in df.columns:
    try:
        if is_object_dtype(df[col]):
            nunique = df[col].dropna().nunique()
            if 2 <= nunique < 20:
                mcq_cols.append(col)
    except Exception:
        continue
for col in mcq_cols:
    try:
        vc = df[col].value_counts(dropna=False).reset_index()
        vc.columns = [col, 'Count']
        fig = px.bar(vc, x=col, y='Count', title=f'Bar Chart: {col}')
        if st:
            st.plotly_chart(fig, key=f"plotly_chart_{col}")
        else:
            fig.show()
    except Exception as e:
        print(f'Skipping {col} due to error: {e}')

# Heatmap for correlation between MCQ questions (using label encoding)
from sklearn.preprocessing import LabelEncoder
if mcq_cols:
    try:
        mcq_encoded = df[mcq_cols].apply(lambda x: LabelEncoder().fit_transform(x.astype(str)))
        corr = mcq_encoded.corr()
        fig = px.imshow(corr, text_auto=True, title='Correlation Heatmap of MCQ Questions')
        if st:
            st.plotly_chart(fig, key=f"plotly_chart_{col}_heatmap")
        else:
            fig.show()
    except Exception as e:
        print(f'Could not plot MCQ correlation heatmap: {e}')
else:
    print('No MCQ columns found for correlation heatmap.')

# WordCloud for text responses
text_col = None
for col in df.columns:
    if 'text' in col.lower() or 'feedback' in col.lower() or 'comment' in col.lower():
        text_col = col
        break
if text_col and df[text_col].dropna().astype(str).str.len().sum() > 0:
    try:
        all_words = ' '.join(df[text_col].dropna().astype(str))
        wordcloud = WordCloud(width=800, height=400, background_color='white').generate(all_words)
        if st:
            from io import BytesIO
            buf = BytesIO()
            wordcloud.to_image().save(buf, format='PNG')
            st.image(buf.getvalue())
        else:
            plt.figure(figsize=(10, 5))
            plt.imshow(wordcloud, interpolation='bilinear')
            plt.axis('off')
            plt.title('WordCloud of Text Responses')
            plt.show()
    except Exception as e:
        print(f'Could not generate WordCloud: {e}')
else:
    print('No text response column found or column is empty.')

# Sentiment trend over time (if sentiment and date available)
sentiment_col = None
date_col = None
for col in df.columns:
    if 'sentiment' in col.lower():
        sentiment_col = col
    if 'date' in col.lower() or 'timestamp' in col.lower():
        date_col = col
if sentiment_col and date_col:
    try:
        df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
        df_sorted = df.sort_values(date_col)
        if not df_sorted[sentiment_col].isnull().all():
            fig = px.line(df_sorted, x=date_col, y=sentiment_col, title='Sentiment Trend Over Time')
            if st:
                st.plotly_chart(fig, key=f"plotly_chart_sentiment_{col}")
            else:
                fig.show()
        else:
            print('Sentiment column is empty.')
    except Exception as e:
        print(f'Could not plot sentiment trend: {e}')
else:
    print('Sentiment or date column not found for trend plot.')

# %% [markdown]
# ## 5. Interactive Dashboard
# We will provide an interactive dashboard using Plotly and Streamlit (if available) for decision-makers.

# %%
# Interactive dashboard using Streamlit (if available)
if st:
    st.title('Survey Analytics Dashboard')
    st.write('Total responses:', len(df))
    if time_col:
        st.subheader('Completion Time Distribution')
        st.plotly_chart(px.histogram(df, x=time_col, nbins=20, title='Completion Time Distribution'))
    if date_col:
        st.subheader('Response Count per Day')
        daily_counts = df[date_col].dt.date.value_counts().sort_index()
        st.bar_chart(daily_counts)
    for col in mcq_cols:
        st.subheader(f'MCQ Bar Chart: {col}')
        vc = df[col].value_counts(dropna=False).reset_index()
        vc.columns = [col, 'Count']
    st.plotly_chart(px.bar(vc, x=col, y='Count', title=f'Bar Chart: {col}', labels={col: col, 'Count': 'Count'}), key=f"plotly_chart_bar_{col}")
    st.subheader('MCQ Correlation Heatmap')
    st.plotly_chart(px.imshow(corr, text_auto=True, title='Correlation Heatmap of MCQ Questions'))
    if text_col:
        st.subheader('WordCloud of Text Responses')
        from io import BytesIO
        buf = BytesIO()
        wordcloud.to_image().save(buf, format='PNG')
        st.image(buf.getvalue())
    if sentiment_col and date_col:
        st.subheader('Sentiment Trend Over Time')
        st.plotly_chart(px.line(df_sorted, x=date_col, y=sentiment_col, title='Sentiment Trend Over Time'))
else:
    print('Streamlit not available. Use Plotly charts above for interactivity in notebook.')

# %% [markdown]
# ## 6. Summary and Insights
# 
# - The dashboard and visualizations provide a clear overview of survey participation, response patterns, and key insights.
# - Use these visual tools to identify trends, areas for improvement, and actionable feedback for decision-making.


