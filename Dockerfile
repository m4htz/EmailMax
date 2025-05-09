FROM python:3.11-slim

WORKDIR /app

# Instalar dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar o código-fonte
COPY . .

# Expor a porta
EXPOSE 5000

# Configurar ambiente de produção
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

# Executar com Gunicorn para produção
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app", "--workers", "4", "--timeout", "60"] 