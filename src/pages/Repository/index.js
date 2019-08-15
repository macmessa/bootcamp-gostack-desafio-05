import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import { Loading, Owner, IssueList, IssueLabel, IssueFilter } from './styles';
import api from '../../services/api';
import Container from '../../components/Container';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repoName: '',
    repository: {},
    issues: [],
    loading: true,
    filters: ['open', 'closed', 'all'],
    filterIndex: 0,
  };

  // Load repositories data
  async componentDidMount() {
    const { filters, filterIndex } = this.state;
    const { match } = this.props;
    const repoName = decodeURIComponent(match.params.repository);

    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues?page=1`, {
        params: {
          state: filters[filterIndex],
          per_page: 5,
        },
      }),
    ]);

    this.setState({
      repoName,
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  // Reload issues based on filter, pagination, ...
  getIssues = async () => {
    const { repoName, filters, filterIndex } = this.state;

    const issues = await api.get(`/repos/${repoName}/issues?page=1`, {
      params: {
        state: filters[filterIndex],
        per_page: 5,
      },
    });

    this.setState({
      issues: issues.data,
      loading: false,
    });
  };

  handleFilter = async e => {
    await this.setState({ filterIndex: +e.target.value });
    this.getIssues();
  };

  render() {
    const { repository, issues, loading, filters, filterIndex } = this.state;

    if (loading) {
      return <Loading>Carregando</Loading>;
    }

    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <IssueList>
          <IssueFilter active={filterIndex}>
            {filters.map((filter, index) => (
              <button
                type="button"
                key={filter}
                value={index}
                onClick={this.handleFilter}
              >
                {filter}
              </button>
            ))}
          </IssueFilter>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a
                    href={issue.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {issue.title}
                  </a>
                  {issue.labels.map(label => (
                    <IssueLabel
                      key={String(label.id)}
                      background={`#${label.color}`}
                    >
                      {label.name}
                    </IssueLabel>
                  ))}
                  <p>{issue.user.login}</p>
                </strong>
              </div>
            </li>
          ))}
        </IssueList>
      </Container>
    );
  }
}
